"""Background processing pipeline: parse -> classify -> index -> ready/error."""
from __future__ import annotations

import logging
from pathlib import Path

from services import classifier, embedder, parser, store

logger = logging.getLogger(__name__)


def process_document(document_id: str, file_path: Path, document_name: str) -> None:
    try:
        store.update_document(document_id, status="parsing")
        parsed = parser.parse_document(document_id, file_path, document_name)
        store.update_document(document_id, page_count=len(parsed.pages))

        store.update_document(document_id, status="classifying")
        result = classifier.classify_document(parsed)
        store.update_document(document_id, classification=result.classification.model_dump())

        store.update_document(document_id, status="indexing")
        embedder.index_document(parsed)

        store.update_document(document_id, status="ready")
        logger.info("Document %s (%s) ready", document_id, document_name)
    except Exception as exc:
        logger.exception("Pipeline failed for document %s (%s)", document_id, document_name)
        store.update_document(document_id, status="error", error_message=str(exc))
