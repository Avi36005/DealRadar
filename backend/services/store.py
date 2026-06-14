"""Lightweight JSON-backed document metadata store.

Tracks per-document processing status, classification results, and page
counts. A simple file + lock is sufficient for this assessment's scale and
keeps the project free of an external database dependency.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from config import DB_FILE

_lock = threading.Lock()


def _read() -> Dict[str, Any]:
    if not DB_FILE.exists():
        return {}
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _write(data: Dict[str, Any]) -> None:
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = DB_FILE.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    tmp_path.replace(DB_FILE)


def create_document(document_id: str, filename: str, status: str = "queued") -> Dict[str, Any]:
    with _lock:
        data = _read()
        entry = {
            "document_id": document_id,
            "filename": filename,
            "status": status,
            "classification": None,
            "error_message": None,
            "page_count": 0,
            "upload_timestamp": datetime.utcnow().isoformat() + "Z",
        }
        data[document_id] = entry
        _write(data)
        return entry


def update_document(document_id: str, **fields: Any) -> Optional[Dict[str, Any]]:
    with _lock:
        data = _read()
        if document_id not in data:
            return None
        data[document_id].update(fields)
        _write(data)
        return data[document_id]


def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        data = _read()
        return data.get(document_id)


def get_all_documents() -> List[Dict[str, Any]]:
    with _lock:
        data = _read()
        return sorted(data.values(), key=lambda d: d.get("upload_timestamp", ""), reverse=True)


def find_by_filename(filename: str) -> Optional[Dict[str, Any]]:
    with _lock:
        data = _read()
        for entry in data.values():
            if entry.get("filename") == filename:
                return entry
    return None
