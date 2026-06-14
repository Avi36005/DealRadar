"""LLM-based document classification.

Primary: Google Gemini (free tier) via google-generativeai.
Fallback: local Ollama server, if GEMINI_API_KEY is unset/unavailable.

Output is validated against the `Classification` pydantic schema before
being persisted, guaranteeing a consistent shape regardless of which model
produced it.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone

from models.schemas import Classification, ClassificationResult, ContentCharacteristics, ParsedDocument
from services import llm_client

logger = logging.getLogger(__name__)

MAX_CHARS = 3000

VALID_DOCUMENT_TYPES = {
    "contract", "invoice", "report", "research_paper", "legal", "medical",
    "financial", "manual", "form", "correspondence", "presentation", "other",
}
VALID_SENSITIVITY_LEVELS = {"public", "internal", "confidential", "highly_confidential"}

# Maps near-miss values the LLM sometimes returns onto the closest valid DocumentType.
DOCUMENT_TYPE_ALIASES = {
    "proposal": "report",
    "policy": "manual",
    "policy_document": "manual",
    "memo": "correspondence",
    "memorandum": "correspondence",
    "email": "correspondence",
    "letter": "correspondence",
    "agreement": "contract",
    "receipt": "invoice",
    "bill": "invoice",
    "resume": "other",
    "cv": "other",
    "slides": "presentation",
    "spreadsheet": "financial",
    "paper": "research_paper",
}

SYSTEM_PROMPT = """You are a document classification system. Analyze the document excerpt \
below and respond with ONLY a single JSON object (no markdown fences, no commentary) matching \
exactly this schema:

{
  "document_type": one of ["contract", "invoice", "report", "research_paper", "legal", "medical", \
"financial", "manual", "form", "correspondence", "presentation", "other"],
  "topic_domain": short string, e.g. "Finance", "HR", "Engineering", "Legal",
  "topic_summary": 1-2 sentence summary of what this document is about,
  "content_characteristics": {
    "has_tables": boolean,
    "has_images": boolean,
    "has_handwriting": boolean,
    "is_scanned": boolean,
    "is_multi_page": boolean,
    "language": ISO 639-1 code, e.g. "en"
  },
  "sensitivity_level": one of ["public", "internal", "confidential", "highly_confidential"],
  "sensitivity_reason": short string explaining the sensitivity level,
  "estimated_date": ISO date string (YYYY-MM-DD) if a date is evident in the text, else null,
  "key_entities": list of up to 8 important named entities (people, orgs, products)
}

Base has_tables/has_images/is_scanned/is_multi_page on the provided metadata hints, not guesses.
Respond with ONLY the JSON object."""


def classify_document(parsed: ParsedDocument) -> ClassificationResult:
    excerpt = _build_excerpt(parsed)
    hints = _build_hints(parsed)

    prompt = f"{SYSTEM_PROMPT}\n\nMetadata hints: {json.dumps(hints)}\n\nDocument excerpt:\n{excerpt}"

    raw, model_used = llm_client.generate(prompt, json_mode=True)
    data = _extract_json(raw)

    classification = _validate(data, hints)

    return ClassificationResult(
        document_id=parsed.document_id,
        document_name=parsed.document_name,
        classification=classification,
        classified_at=datetime.now(timezone.utc).isoformat(),
        model_used=model_used,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _build_excerpt(parsed: ParsedDocument) -> str:
    text = "\n".join(page.extracted_text for page in parsed.pages)
    return text[:MAX_CHARS]


def _build_hints(parsed: ParsedDocument) -> dict:
    has_tables = any(page.tables for page in parsed.pages)
    has_images = any(page.has_images for page in parsed.pages)
    is_scanned = any(page.is_scanned for page in parsed.pages)
    return {
        "filename": parsed.document_name,
        "page_count": len(parsed.pages),
        "has_tables": has_tables,
        "has_images": has_images,
        "is_scanned": is_scanned,
        "is_multi_page": len(parsed.pages) > 1,
    }


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    # Strip markdown code fences if the model added them anyway.
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    logger.warning("Could not parse classification JSON, using defaults. Raw: %s", raw[:200])
    return {}


def _validate(data: dict, hints: dict) -> Classification:
    # Fill in sensible defaults for anything the model omitted or got wrong,
    # so Pydantic validation always succeeds.
    content = data.get("content_characteristics") or {}
    content.setdefault("has_tables", hints["has_tables"])
    content.setdefault("has_images", hints["has_images"])
    content.setdefault("has_handwriting", False)
    content.setdefault("is_scanned", hints["is_scanned"])
    content.setdefault("is_multi_page", hints["is_multi_page"])
    content.setdefault("language", "en")
    data["content_characteristics"] = content

    data.setdefault("document_type", "other")
    doc_type = str(data["document_type"]).strip().lower()
    if doc_type not in VALID_DOCUMENT_TYPES:
        doc_type = DOCUMENT_TYPE_ALIASES.get(doc_type, "other")
    data["document_type"] = doc_type

    data.setdefault("topic_domain", "General")
    data.setdefault("topic_summary", "")

    data.setdefault("sensitivity_level", "internal")
    sensitivity = str(data["sensitivity_level"]).strip().lower()
    if sensitivity not in VALID_SENSITIVITY_LEVELS:
        sensitivity = "internal"
    data["sensitivity_level"] = sensitivity
    data.setdefault("sensitivity_reason", "Default classification — model output unavailable.")
    data.setdefault("estimated_date", None)
    data.setdefault("key_entities", [])

    try:
        return Classification.model_validate(data)
    except Exception as exc:
        logger.warning("Classification validation failed (%s), using defaults", exc)
        return Classification(content_characteristics=ContentCharacteristics(**content))


from models.schemas import ContentCharacteristics  # noqa: E402  (used in fallback above)
