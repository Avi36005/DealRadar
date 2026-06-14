"""Thin LLM wrapper shared by the classifier and RAG agent.

Primary: Groq (Llama 3.3, free tier, fast). Secondary: Google Gemini
(free tier). Fallback: local Ollama server. The classifier and the RAG
agent both call `generate()` so the provider/fallback logic lives in
exactly one place.
"""
from __future__ import annotations

import logging

import requests

from config import (
    GEMINI_API_KEY,
    GROQ_API_KEY,
    GROQ_MODEL,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    OPENAI_API_KEY,
    OPENAI_MODEL,
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


def generate(prompt: str, json_mode: bool = False) -> tuple[str, str]:
    """Generate text from the configured LLM. Returns (text, model_used)."""
    if GROQ_API_KEY:
        try:
            return _groq(prompt, json_mode), f"groq/{GROQ_MODEL}"
        except Exception as exc:
            logger.warning("Groq call failed, falling back: %s", exc)

    if GEMINI_API_KEY:
        try:
            return _gemini(prompt, json_mode), GEMINI_MODEL
        except Exception as exc:
            logger.warning("Gemini call failed, falling back: %s", exc)

    if OPENAI_API_KEY:
        try:
            return _openai(prompt, json_mode), f"openai/{OPENAI_MODEL}"
        except Exception as exc:
            logger.warning("OpenAI call failed, falling back to Ollama: %s", exc)

    try:
        return _ollama(prompt, json_mode), f"ollama/{OLLAMA_MODEL}"
    except Exception as exc:
        logger.warning("Ollama call failed: %s", exc)
        return "", "unavailable"


def _groq(prompt: str, json_mode: bool) -> str:
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    resp = requests.post(
        GROQ_API_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _gemini(prompt: str, json_mode: bool) -> str:
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    generation_config = {"temperature": 0.2}
    if json_mode:
        generation_config["response_mime_type"] = "application/json"
    response = model.generate_content(prompt, generation_config=generation_config)
    return response.text


def _openai(prompt: str, json_mode: bool) -> str:
    payload = {
        "model": OPENAI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    resp = requests.post(
        OPENAI_API_URL,
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _ollama(prompt: str, json_mode: bool) -> str:
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    if json_mode:
        payload["format"] = "json"
    resp = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json().get("response", "")
