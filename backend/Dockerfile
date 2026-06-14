# DocumentIQ backend — Document Intelligence + Agentic RAG
FROM python:3.11-slim

# System dependencies:
#   poppler-utils -> pdf2image (page rendering)
#   tesseract-ocr -> pytesseract (OCR for scanned/handwritten pages)
#   libmagic1     -> python-magic (MIME type detection)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install the CPU-only PyTorch build first (sentence-transformers depends on
# torch but the default PyPI wheel bundles CUDA libraries, ballooning the
# image by >1GB — unnecessary for a free-tier CPU deployment).
RUN pip install --no-cache-dir torch==2.8.0 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p storage/uploads storage/page_images storage/vector_db storage/parsed

EXPOSE 8000

# Cloud Run sets $PORT (default 8080); fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
