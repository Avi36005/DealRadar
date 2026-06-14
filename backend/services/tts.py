"""ElevenLabs text-to-speech wrapper for the "AI Voice Replies" feature."""
from __future__ import annotations

import logging

import requests

from config import ELEVENLABS_API_KEY, ELEVENLABS_MODEL, ELEVENLABS_VOICE_ID

logger = logging.getLogger(__name__)

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
MAX_CHARS = 2000


class TTSUnavailable(Exception):
    """Raised when speech synthesis cannot be performed."""


def synthesize(text: str) -> bytes:
    """Return MP3 audio bytes for `text` via ElevenLabs. Raises TTSUnavailable on failure."""
    if not ELEVENLABS_API_KEY:
        raise TTSUnavailable("ELEVENLABS_API_KEY is not configured")

    text = text.strip()[:MAX_CHARS]
    if not text:
        raise TTSUnavailable("No text to synthesize")

    resp = requests.post(
        ELEVENLABS_TTS_URL.format(voice_id=ELEVENLABS_VOICE_ID),
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": text,
            "model_id": ELEVENLABS_MODEL,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.content
