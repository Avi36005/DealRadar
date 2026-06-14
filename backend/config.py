"""Centralized configuration loaded from environment variables (.env)."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# --- Secrets / external services -------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_multilingual_v2")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

# --- CORS / networking -------------------------------------------------------------
_default_cors_origins = (
    "http://localhost:3000,"
    "https://documentiq-app.web.app,"
    "https://documentiq-app.firebaseapp.com"
)
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", os.getenv("CORS_ALLOWED_ORIGIN", _default_cors_origins)).split(",")
    if origin.strip()
]

# --- Storage -------------------------------------------------------------------------
UPLOAD_MAX_SIZE_MB = int(os.getenv("UPLOAD_MAX_SIZE_MB", "50"))
UPLOAD_MAX_SIZE_BYTES = UPLOAD_MAX_SIZE_MB * 1024 * 1024

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./storage/uploads")).resolve()
PAGE_IMAGES_DIR = Path(os.getenv("PAGE_IMAGES_DIR", "./storage/page_images")).resolve()
CHROMA_PERSIST_DIR = Path(os.getenv("CHROMA_PERSIST_DIR", "./storage/vector_db")).resolve()
PARSED_DIR = (BASE_DIR / "storage" / "parsed").resolve()
DB_FILE = (BASE_DIR / "storage" / "documents.json").resolve()
SAMPLE_DOCS_DIR = (BASE_DIR / "sample_docs").resolve()

for directory in (UPLOAD_DIR, PAGE_IMAGES_DIR, CHROMA_PERSIST_DIR, PARSED_DIR):
    directory.mkdir(parents=True, exist_ok=True)

# --- Allowed upload types -----------------------------------------------------------
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    # python-magic sometimes reports modern docx/zip-based files as zip
    "application/zip",
}

# --- RAG tuning -----------------------------------------------------------------------
CHUNK_SIZE_TOKENS = 400
CHUNK_OVERLAP_TOKENS = 50
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
NO_ANSWER_MESSAGE = "I could not find relevant information in the uploaded documents."
