"""Text-to-speech endpoint powering the "AI Voice Replies" toggle."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response

from config import ELEVENLABS_API_KEY
from models.schemas import VoiceRequest
from security import limiter, verify_api_key
from services import tts

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/status", dependencies=[Depends(verify_api_key)])
async def voice_status() -> dict:
    return {"enabled": bool(ELEVENLABS_API_KEY)}


@router.post("/speak", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def speak(request: Request, payload: VoiceRequest) -> Response:
    try:
        audio = tts.synthesize(payload.text)
    except tts.TTSUnavailable as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Speech synthesis failed: {exc}") from exc
    return Response(content=audio, media_type="audio/mpeg")
