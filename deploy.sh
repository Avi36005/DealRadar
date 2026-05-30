#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
PROJECT_ID="mediflow-nexus-2026"
REGION="asia-south1"
BACKEND_SERVICE="dealradar-backend"
FRONTEND_SERVICE="dealradar-frontend"

BACKEND_IMAGE="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/${FRONTEND_SERVICE}"

# ─── Project setup ────────────────────────────────────────────────────────────
echo ">>> Setting active GCP project to: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

echo ">>> Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  cloudscheduler.googleapis.com

# ─── Firestore ────────────────────────────────────────────────────────────────
echo ">>> Creating Firestore database 'dealradar' in ${REGION} (skips if already exists)..."
gcloud firestore databases create \
  --database=dealradar \
  --location=asia-south1 \
  --type=firestore-native 2>/dev/null || true

# ─── Backend ──────────────────────────────────────────────────────────────────
echo ">>> Building and pushing backend image..."
gcloud builds submit ./backend \
  --tag "${BACKEND_IMAGE}"

echo ">>> Deploying backend to Cloud Run..."
gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${BACKEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --timeout 300 \
  --no-cpu-throttling \
  --set-env-vars "GROQ_API_KEY=${GROQ_API_KEY},GEMINI_API_KEY=${GEMINI_API_KEY},OPENAI_API_KEY=${OPENAI_API_KEY},ANAKIN_WIRE_API_KEY=${ANAKIN_WIRE_API_KEY},RESEND_API_KEY=${RESEND_API_KEY},CRON_SECRET=${CRON_SECRET},GOOGLE_CLOUD_PROJECT=${PROJECT_ID},FIRESTORE_DATABASE_ID=dealradar"

echo ">>> Retrieving backend Cloud Run URL..."
BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
  --region "${REGION}" \
  --format "value(status.url)")
echo "    Backend URL: ${BACKEND_URL}"

# ─── Frontend ─────────────────────────────────────────────────────────────────
echo ">>> Building and pushing frontend image..."
gcloud builds submit ./frontend \
  --tag "${FRONTEND_IMAGE}"

echo ">>> Deploying frontend to Cloud Run..."
gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${FRONTEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "NEXT_PUBLIC_API_URL=${BACKEND_URL}"

echo ">>> Retrieving frontend Cloud Run URL..."
FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
  --region "${REGION}" \
  --format "value(status.url)")
echo "    Frontend URL: ${FRONTEND_URL}"

# ─── Cloud Scheduler ──────────────────────────────────────────────────────────
echo ">>> Creating Cloud Scheduler job for daily price-check (8 AM IST)..."
gcloud scheduler jobs create http dealradar-price-check \
  --location "${REGION}" \
  --schedule "0 8 * * *" \
  --time-zone "Asia/Kolkata" \
  --uri "${BACKEND_URL}/api/cron/price-check" \
  --http-method GET \
  --description "DealRadar: daily deal price-check cron" \
  2>/dev/null || \
gcloud scheduler jobs update http dealradar-price-check \
  --location "${REGION}" \
  --schedule "0 8 * * *" \
  --time-zone "Asia/Kolkata" \
  --uri "${BACKEND_URL}/api/cron/price-check" \
  --http-method GET

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  DealRadar deployment complete!"
echo "========================================="
echo "  Frontend : ${FRONTEND_URL}"
echo "  Backend  : ${BACKEND_URL}"
echo "========================================="
