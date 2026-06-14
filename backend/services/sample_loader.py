"""On startup, ensure the bundled sample documents are parsed/classified/indexed.

Each sample file is assigned a deterministic document_id (derived from its
filename) so repeated restarts don't reprocess documents that are already
indexed in ChromaDB.
"""
from __future__ import annotations

import logging
import uuid

from config import SAMPLE_DOCS_DIR
from services import embedder, pipeline, store

logger = logging.getLogger(__name__)

_NAMESPACE = uuid.UUID("a8c9f2b0-6e3d-4f1a-9c2b-1d4e5f6a7b8c")


def ensure_sample_docs_indexed() -> None:
    if not SAMPLE_DOCS_DIR.exists():
        return

    for file_path in sorted(SAMPLE_DOCS_DIR.iterdir()):
        if file_path.suffix.lower() not in (".pdf", ".txt", ".docx"):
            continue

        document_id = uuid.uuid5(_NAMESPACE, file_path.name).hex

        if store.get_document(document_id) and embedder.is_indexed(document_id):
            logger.info("Sample document %s already indexed, skipping", file_path.name)
            continue

        if not store.get_document(document_id):
            store.create_document(document_id, file_path.name)

        logger.info("Indexing sample document %s (%s)", file_path.name, document_id)
        pipeline.process_document(document_id, file_path, file_path.name)
