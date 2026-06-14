"""Shared security helpers: API key auth, filename sanitization, rate limiting."""
from __future__ import annotations

import re
from pathlib import Path

from fastapi import Header, HTTPException, Query, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import API_SECRET_KEY

limiter = Limiter(key_func=get_remote_address)

_FILENAME_UNSAFE = re.compile(r"[^a-zA-Z0-9._-]")


def sanitize_filename(filename: str) -> str:
    """Strip directory components and any character outside [a-zA-Z0-9._-]."""
    name = Path(filename).name  # drops any path components, defeats "../"
    name = _FILENAME_UNSAFE.sub("", name)
    return name or "file"


async def verify_api_key(x_api_key: str = Header(default="")) -> None:
    """Require a valid X-API-Key header on every protected endpoint."""
    if not API_SECRET_KEY or x_api_key != API_SECRET_KEY:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing API key")


async def verify_api_key_flexible(
    x_api_key: str = Header(default=""), api_key: str = Query(default="")
) -> None:
    """Same check as `verify_api_key`, but also accepts ?api_key=... for <img> tags."""
    provided = x_api_key or api_key
    if not API_SECRET_KEY or provided != API_SECRET_KEY:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing API key")
