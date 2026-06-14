"""Chunking, local embedding (sentence-transformers), and ChromaDB indexing."""
from __future__ import annotations

import logging
from typing import List

import chromadb
from sentence_transformers import SentenceTransformer

from config import CHROMA_PERSIST_DIR, CHUNK_OVERLAP_TOKENS, CHUNK_SIZE_TOKENS, EMBEDDING_MODEL_NAME
from models.schemas import ParsedDocument

logger = logging.getLogger(__name__)

COLLECTION_NAME = "bfai_documents"

_model: SentenceTransformer | None = None
_client: chromadb.ClientAPI | None = None
_collection = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading embedding model %s ...", EMBEDDING_MODEL_NAME)
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(CHROMA_PERSIST_DIR))
        _collection = _client.get_or_create_collection(
            COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
        )
    return _collection


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_TOKENS, overlap: int = CHUNK_OVERLAP_TOKENS) -> List[str]:
    """Split text into overlapping chunks. Token counts are approximated by word counts."""
    words = text.split()
    if not words:
        return []

    chunks: List[str] = []
    step = max(chunk_size - overlap, 1)
    for start in range(0, len(words), step):
        chunk_words = words[start : start + chunk_size]
        chunks.append(" ".join(chunk_words))
        if start + chunk_size >= len(words):
            break
    return chunks


def index_document(parsed: ParsedDocument) -> int:
    """Chunk + embed every page of `parsed` and upsert into ChromaDB. Returns chunk count."""
    collection = _get_collection()
    model = _get_model()

    delete_document(parsed.document_id)

    ids, documents, metadatas = [], [], []
    for page in parsed.pages:
        if not page.extracted_text.strip():
            continue
        for chunk_index, chunk in enumerate(chunk_text(page.extracted_text)):
            ids.append(f"{parsed.document_id}_p{page.page_number}_c{chunk_index}")
            documents.append(chunk)
            metadatas.append(
                {
                    "document_id": parsed.document_id,
                    "document_name": parsed.document_name,
                    "page_number": page.page_number,
                    "chunk_index": chunk_index,
                    "page_image_path": page.page_image_path,
                }
            )

    if not documents:
        return 0

    embeddings = model.encode(documents, show_progress_bar=False).tolist()
    collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    return len(documents)


def delete_document(document_id: str) -> None:
    collection = _get_collection()
    try:
        collection.delete(where={"document_id": document_id})
    except Exception as exc:
        logger.warning("Failed to delete existing chunks for %s: %s", document_id, exc)


def is_indexed(document_id: str) -> bool:
    collection = _get_collection()
    result = collection.get(where={"document_id": document_id}, limit=1)
    return bool(result.get("ids"))


def query(query_texts: List[str], top_k: int = 5) -> dict:
    """Run a batch of queries against the collection.

    Returns the raw ChromaDB result dict: each of "ids"/"documents"/"metadatas"/"distances"
    is a list with one entry per input query.
    """
    collection = _get_collection()
    if collection.count() == 0:
        return {"ids": [[]] * len(query_texts), "documents": [[]] * len(query_texts), "metadatas": [[]] * len(query_texts), "distances": [[]] * len(query_texts)}

    model = _get_model()
    embeddings = model.encode(query_texts, show_progress_bar=False).tolist()
    return collection.query(
        query_embeddings=embeddings,
        n_results=min(top_k, collection.count()),
    )
