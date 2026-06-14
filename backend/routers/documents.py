"""Document library listing + authenticated page-image serving."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from config import PAGE_IMAGES_DIR
from models.schemas import DocumentSummary
from security import verify_api_key, verify_api_key_flexible
from services import store

router = APIRouter(prefix="/api", tags=["documents"])


@router.get(
    "/upload/documents",
    response_model=List[DocumentSummary],
    dependencies=[Depends(verify_api_key)],
)
async def list_documents() -> List[DocumentSummary]:
    docs = store.get_all_documents()
    return [
        DocumentSummary(
            document_id=d["document_id"],
            name=d["filename"],
            status=d["status"],
            classification=d.get("classification"),
            page_count=d.get("page_count", 0),
            upload_timestamp=d["upload_timestamp"],
        )
        for d in docs
    ]


@router.get("/pages/{document_id}/{page_number}", dependencies=[Depends(verify_api_key_flexible)])
async def get_page_image(document_id: str, page_number: int) -> FileResponse:
    doc = store.get_document(document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    if page_number < 1 or page_number > doc.get("page_count", 0):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")

    image_path = PAGE_IMAGES_DIR / document_id / f"page_{page_number:03d}.png"
    if not image_path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page image not found")

    return FileResponse(image_path, media_type="image/png")
