#!/usr/bin/env bash
set -euo pipefail

# ─── Load secrets from local file (never committed) ───────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/secrets.env" ]]; then
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/secrets.env"
fi

# ─── Validate required env vars are set ──────────────────────────────────────
REQUIRED=(FB_API_KEY FB_AUTH_DOMAIN FB_PROJECT_ID FB_STORAGE_BUCKET FB_MSG_SENDER_ID FB_APP_ID
          ANAKIN_KEY GROQ_KEY OPENAI_KEY GEMINI_KEY RESEND_KEY CRON_SECRET)
for VAR in "${REQUIRED[@]}"; do
  if [[ -z "${!VAR:-}" ]]; then
    echo "ERROR: ${VAR} is not set. Run: source secrets.env && ./deploy.sh"
    exit 1
  fi
done

# ─── Config ───────────────────────────────────────────────────────────────────
PROJECT_ID="mediflow-nexus-2026"
REGION="asia-south1"
BACKEND_SERVICE="dealradar-backend"
FRONTEND_SERVICE="dealradar-frontend"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/${FRONTEND_SERVICE}"

# ─── GCP project & APIs ───────────────────────────────────────────────────────
echo ">>> Setting GCP project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

echo ">>> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com \
  cloudscheduler.googleapis.com \
  iam.googleapis.com

# ─── Firestore named database (isolated from existing mediflow data) ───────────
echo ">>> Ensuring Firestore database 'dealradar' exists..."
gcloud firestore databases create \
  --database=dealradar \
  --location=asia-south1 \
  --type=firestore-native 2>/dev/null || echo "    (already exists — skipping)"

# ─── IAM: give Cloud Run service account Firestore access ────────────────────
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
CR_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo ">>> Granting Firestore access to Cloud Run SA: ${CR_SA}"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CR_SA}" \
  --role="roles/datastore.user" \
  --condition=None 2>/dev/null || true

# ─── Backend: build → push → deploy ──────────────────────────────────────────
echo ">>> Building backend image..."
gcloud builds submit ./backend --tag "${BACKEND_IMAGE}" --quiet

echo ">>> Deploying backend to Cloud Run..."
gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${BACKEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars \
"PORT=8000,\
GOOGLE_CLOUD_PROJECT=${PROJECT_ID},\
FIRESTORE_DATABASE_ID=dealradar,\
ANAKIN_WIRE_API_KEY=${ANAKIN_KEY},\
GROQ_API_KEY=${GROQ_KEY},\
OPENAI_API_KEY=${OPENAI_KEY},\
GEMINI_API_KEY=${GEMINI_KEY},\
RESEND_API_KEY=${RESEND_KEY},\
CRON_SECRET=${CRON_SECRET}"

BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
  --region "${REGION}" --format "value(status.url)")
echo "    Backend live: ${BACKEND_URL}"

# ─── Frontend: build with NEXT_PUBLIC_ baked in → push → deploy ──────────────
echo ">>> Building frontend image (baking in Firebase config + backend URL)..."
gcloud builds submit ./frontend \
  --config ./frontend/cloudbuild.yaml \
  --substitutions \
"_FB_API_KEY=${FB_API_KEY},\
_FB_AUTH_DOMAIN=${FB_AUTH_DOMAIN},\
_FB_PROJECT_ID=${FB_PROJECT_ID},\
_FB_STORAGE_BUCKET=${FB_STORAGE_BUCKET},\
_FB_MSG_SENDER_ID=${FB_MSG_SENDER_ID},\
_FB_APP_ID=${FB_APP_ID},\
_API_URL=${BACKEND_URL}" \
  --quiet

echo ">>> Deploying frontend to Cloud Run..."
gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${FRONTEND_IMAGE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --min-instances 0 \
  --max-instances 3

FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
  --region "${REGION}" --format "value(status.url)")
echo "    Frontend live: ${FRONTEND_URL}"

# ─── Cloud Scheduler: daily watchlist price-check at 8 AM IST ─────────────────
echo ">>> Setting up Cloud Scheduler cron job..."
gcloud scheduler jobs create http dealradar-price-check \
  --location "${REGION}" \
  --schedule "0 8 * * *" \
  --time-zone "Asia/Kolkata" \
  --uri "${BACKEND_URL}/api/cron/price-check" \
  --http-method GET \
  --headers "Authorization=Bearer ${CRON_SECRET}" \
  2>/dev/null || \
gcloud scheduler jobs update http dealradar-price-check \
  --location "${REGION}" \
  --uri "${BACKEND_URL}/api/cron/price-check" \
  --headers "Authorization=Bearer ${CRON_SECRET}"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "  DealRadar deployed successfully!"
echo "  Frontend : ${FRONTEND_URL}"
echo "  Backend  : ${BACKEND_URL}"
echo "  Cron     : daily 08:00 IST"
echo "╚══════════════════════════════════════════╝"
