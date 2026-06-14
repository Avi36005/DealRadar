"""Agentic RAG pipeline.

1. Query Expansion   - rewrite the question into 2-3 semantically varied queries.
2. Multi-Query Retrieval - top-K chunks per query from ChromaDB.
3. Dedup + Rerank    - dedupe by (document_id, page, chunk_index), sort by distance.
4. Synthesis         - ask the LLM to answer using ONLY the retrieved context,
                        with inline [DocumentName, p.N] citations, or an explicit
                        "not found" refusal.
5. Citation Extraction - parse the citation markers back into structured Citation objects.
"""
from __future__ import annotations

import json
import logging
import re
from typing import List

from config import NO_ANSWER_MESSAGE
from models.schemas import ChatMessage, Citation
from services import embedder, llm_client

logger = logging.getLogger(__name__)

RETRIEVAL_TOP_K = 5
RERANK_TOP_N = 8

CITATION_PATTERN = re.compile(r"\[([^,\]]+),\s*p\.\s*(\d+)\]")

QUERY_EXPANSION_PROMPT = """Rewrite the user's question below into 2 alternative search \
queries that capture the same intent using different wording, synonyms, or related \
terminology. Respond with ONLY a JSON array of 2 strings — no commentary, no markdown.

Question: {question}"""

SYNTHESIS_PROMPT = """You are a document Q&A assistant. Answer the user's question using \
ONLY the information in the context excerpts below. Each excerpt is labeled with its source \
document name and page number.

Rules:
- Every factual claim in your answer MUST end with an inline citation in the exact format \
[DocumentName, p.N], where DocumentName and N exactly match the source label of the excerpt \
you drew the claim from.
- Do NOT use any knowledge outside the provided context.
- If the context does not contain information relevant to the question, respond with EXACTLY \
this sentence and nothing else: "{no_answer}"
- Be concise and direct.

Context:
{context}

Conversation history:
{history}

Question: {question}

Answer:"""


def answer_question(question: str, history: List[ChatMessage]) -> dict:
    queries = _expand_query(question)
    chunks = _retrieve(queries)

    if not chunks:
        return {"answer": NO_ANSWER_MESSAGE, "citations": [], "sources_found": False}

    prompt = SYNTHESIS_PROMPT.format(
        context=_format_context(chunks),
        history=_format_history(history),
        question=question,
        no_answer=NO_ANSWER_MESSAGE,
    )
    raw, _model_used = llm_client.generate(prompt)
    answer = raw.strip() or NO_ANSWER_MESSAGE

    if NO_ANSWER_MESSAGE in answer:
        return {"answer": NO_ANSWER_MESSAGE, "citations": [], "sources_found": False}

    citations = _extract_citations(answer, chunks)
    return {"answer": answer, "citations": citations, "sources_found": True}


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline steps
# ─────────────────────────────────────────────────────────────────────────────


def _expand_query(question: str) -> List[str]:
    queries = [question]
    try:
        raw, _ = llm_client.generate(QUERY_EXPANSION_PROMPT.format(question=question), json_mode=True)
        extra = json.loads(_extract_json_array(raw))
        for q in extra:
            if isinstance(q, str) and q.strip() and q.strip() not in queries:
                queries.append(q.strip())
    except Exception as exc:
        logger.warning("Query expansion failed, using original query only: %s", exc)
    return queries[:3]


def _retrieve(queries: List[str]) -> List[dict]:
    try:
        results = embedder.query(queries, top_k=RETRIEVAL_TOP_K)
    except Exception as exc:
        logger.warning("Retrieval failed: %s", exc)
        return []

    best: dict[tuple, dict] = {}
    for ids, docs, metas, dists in zip(
        results.get("ids", []),
        results.get("documents", []),
        results.get("metadatas", []),
        results.get("distances", []),
    ):
        for id_, doc, meta, dist in zip(ids, docs, metas, dists):
            key = (meta["document_id"], meta["page_number"], meta["chunk_index"])
            if key not in best or dist < best[key]["distance"]:
                best[key] = {"id": id_, "text": doc, "metadata": meta, "distance": dist}

    ranked = sorted(best.values(), key=lambda c: c["distance"])
    return ranked[:RERANK_TOP_N]


def _format_context(chunks: List[dict]) -> str:
    parts = []
    for c in chunks:
        meta = c["metadata"]
        label = f"[{meta['document_name']}, p.{meta['page_number']}]"
        parts.append(f"{label}\n{c['text']}")
    return "\n\n".join(parts)


def _format_history(history: List[ChatMessage]) -> str:
    if not history:
        return "(none)"
    lines = []
    for msg in history[-6:]:
        role = "User" if msg.role == "user" else "Assistant"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)


def _extract_citations(answer: str, chunks: List[dict]) -> List[Citation]:
    citations: List[Citation] = []
    seen = set()
    for match in CITATION_PATTERN.finditer(answer):
        doc_name = match.group(1).strip()
        page_number = int(match.group(2))
        key = (doc_name, page_number)
        if key in seen:
            continue

        meta = next(
            (
                c["metadata"]
                for c in chunks
                if c["metadata"]["document_name"] == doc_name and c["metadata"]["page_number"] == page_number
            ),
            None,
        )
        if meta is None:
            continue

        seen.add(key)
        citations.append(
            Citation(
                document_name=doc_name,
                page_number=page_number,
                page_image_path=meta["page_image_path"],
                document_id=meta["document_id"],
            )
        )
    return citations


def _extract_json_array(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    return match.group(0) if match else "[]"
