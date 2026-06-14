"""Pydantic models shared across the DocumentIQ backend."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# ─────────────────────────────────────────────────────────────────────────────
# Parsing
# ─────────────────────────────────────────────────────────────────────────────


class TableData(BaseModel):
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)


class PageData(BaseModel):
    document_id: str
    page_number: int
    extracted_text: str = ""
    page_image_path: str
    tables: List[TableData] = Field(default_factory=list)
    is_scanned: bool = False
    has_images: bool = False


class ParsedDocument(BaseModel):
    document_id: str
    document_name: str
    pages: List[PageData] = Field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# Classification
# ─────────────────────────────────────────────────────────────────────────────

DocumentType = Literal[
    "contract",
    "invoice",
    "report",
    "research_paper",
    "legal",
    "medical",
    "financial",
    "manual",
    "form",
    "correspondence",
    "presentation",
    "other",
]

SensitivityLevel = Literal["public", "internal", "confidential", "highly_confidential"]


class ContentCharacteristics(BaseModel):
    has_tables: bool = False
    has_images: bool = False
    has_handwriting: bool = False
    is_scanned: bool = False
    is_multi_page: bool = False
    language: str = "en"


class Classification(BaseModel):
    document_type: DocumentType = "other"
    topic_domain: str = "Unknown"
    topic_summary: str = ""
    content_characteristics: ContentCharacteristics = Field(default_factory=ContentCharacteristics)
    sensitivity_level: SensitivityLevel = "internal"
    sensitivity_reason: str = ""
    estimated_date: Optional[str] = None
    key_entities: List[str] = Field(default_factory=list)


class ClassificationResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    document_id: str
    document_name: str
    classification: Classification
    classified_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    model_used: str = "unknown"


# ─────────────────────────────────────────────────────────────────────────────
# Upload / status
# ─────────────────────────────────────────────────────────────────────────────

ProcessingStatus = Literal["queued", "parsing", "classifying", "indexing", "ready", "error"]


class UploadResultItem(BaseModel):
    document_id: str
    filename: str
    status: ProcessingStatus = "queued"


class DocumentStatusResponse(BaseModel):
    document_id: str
    filename: str
    status: ProcessingStatus
    classification: Optional[Classification] = None
    error_message: Optional[str] = None
    page_count: int = 0


class DocumentSummary(BaseModel):
    document_id: str
    name: str
    status: ProcessingStatus
    classification: Optional[Classification] = None
    page_count: int = 0
    upload_timestamp: str


# ─────────────────────────────────────────────────────────────────────────────
# Chat / RAG
# ─────────────────────────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    question: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)


class Citation(BaseModel):
    document_name: str
    page_number: int
    page_image_path: str
    document_id: str


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    sources_found: bool


class VoiceRequest(BaseModel):
    text: str
