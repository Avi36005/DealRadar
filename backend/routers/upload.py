"""Bulk document upload + per-document processing status."""

import logging
import os
import uuid
from pathlib import Path
from typing import List

import magic
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, UploadFile, status

from config import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, UPLOAD_DIR, UPLOAD_MAX_SIZE_BYTES
from models.schemas import DocumentStatusResponse, UploadResultItem
from security import limiter, sanitize_filename, verify_api_key
from services import pipeline, store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post(
    "/bulk",
    response_model=List[UploadResultItem],
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit("10/minute")
async def upload_bulk(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile],
) -> List[UploadResultItem]:
    results: List[UploadResultItem] = []

    for upload_file in files:
        results.append(await _handle_one(upload_file, background_tasks))

    return results


async def _handle_one(upload_file: UploadFile, background_tasks: BackgroundTasks) -> UploadResultItem:
    filename = sanitize_filename(upload_file.filename or "file")
    ext = Path(filename).suffix.lower()
    document_id = uuid.uuid4().hex

    if ext not in ALLOWED_EXTENSIONS:
        store.create_document(document_id, filename, status="error")
        store.update_document(document_id, error_message=f"Unsupported file type: {ext or 'unknown'}")
        return UploadResultItem(document_id=document_id, filename=filename, status="error")

    content = await upload_file.read()

    if len(content) > UPLOAD_MAX_SIZE_BYTES:
        store.create_document(document_id, filename, status="error")
        store.update_document(document_id, error_message="File exceeds maximum allowed size")
        return UploadResultItem(document_id=document_id, filename=filename, status="error")

    mime_type = magic.from_buffer(content, mime=True)
    if mime_type not in ALLOWED_MIME_TYPES:
        store.create_document(document_id, filename, status="error")
        store.update_document(document_id, error_message=f"Unsupported MIME type: {mime_type}")
        return UploadResultItem(document_id=document_id, filename=filename, status="error")

    doc_dir = UPLOAD_DIR / document_id
    doc_dir.mkdir(parents=True, exist_ok=True)
    file_path = doc_dir / filename
    file_path.write_bytes(content)
    os.chmod(file_path, 0o600)

    store.create_document(document_id, filename, status="queued")
    background_tasks.add_task(pipeline.process_document, document_id, file_path, filename)

    return UploadResultItem(document_id=document_id, filename=filename, status="queued")


@router.get(
    "/status/{document_id}",
    response_model=DocumentStatusResponse,
    dependencies=[Depends(verify_api_key)],
)
async def get_status(document_id: str) -> DocumentStatusResponse:
    doc = store.get_document(document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    return DocumentStatusResponse(
        document_id=doc["document_id"],
        filename=doc["filename"],
        status=doc["status"],
        classification=doc.get("classification"),
        error_message=doc.get("error_message"),
        page_count=doc.get("page_count", 0),
    )
