"""DocumentIQ — Document Intelligence + Agentic RAG backend entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import CORS_ALLOWED_ORIGINS
from routers import chat, documents, upload, voice
from security import limiter
from services import sample_loader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Checking sample documents...")
    sample_loader.ensure_sample_docs_indexed()
    logger.info("Startup complete.")
    yield


app = FastAPI(
    title="DocumentIQ — Document Intelligence + Agentic RAG",
    description="Parse, classify, and chat with documents — every answer grounded with page-level citations.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(voice.router)


@app.get("/")
async def root():
    return {"service": "DocumentIQ backend", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok"}
