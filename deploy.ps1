# DealRadar — Cloud Run deployment script (PowerShell)
# Usage: .\deploy.ps1
# Reads all secrets from backend\.env — no keys are hardcoded here.

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ID   = "mediflow-nexus-2026"
$REGION       = "asia-south1"

# ── Load secrets from backend\.env ──────────────────────────────────────────
$envFile = Join-Path $ROOT "backend\.env"
$secrets = @{}
foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
    $parts = $line -split '=', 2
    if ($parts.Count -eq 2) { $secrets[$parts[0].Trim()] = $parts[1].Trim() }
}

# ── Load Firebase config from frontend\.env.local ───────────────────────────
$fbFile = Join-Path $ROOT "frontend\.env.local"
$fb = @{}
foreach ($line in (Get-Content $fbFile)) {
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
    $parts = $line -split '=', 2
    if ($parts.Count -eq 2) { $fb[$parts[0].Trim()] = $parts[1].Trim() }
}

# ── Step 1: Deploy backend ───────────────────────────────────────────────────
Write-Host "`n>>> Deploying backend..." -ForegroundColor Cyan

$envVars = "GOOGLE_CLOUD_PROJECT=$PROJECT_ID," +
           "FIRESTORE_DATABASE_ID=dealradar," +
           "ANAKIN_WIRE_API_KEY=$($secrets['ANAKIN_WIRE_API_KEY'])," +
           "GROQ_API_KEY=$($secrets['GROQ_API_KEY'])," +
           "OPENAI_API_KEY=$($secrets['OPENAI_API_KEY'])," +
           "GEMINI_API_KEY=$($secrets['GEMINI_API_KEY'])," +
           "RESEND_API_KEY=$($secrets['RESEND_API_KEY'])," +
           "CRON_SECRET=$($secrets['CRON_SECRET'])"

gcloud run deploy dealradar-backend `
    --source (Join-Path $ROOT "backend") `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 8000 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 3 `
    --set-env-vars $envVars `
    --quiet

$BACKEND_URL = (gcloud run services describe dealradar-backend --region $REGION --format "value(status.url)").Trim()
Write-Host "Backend live: $BACKEND_URL" -ForegroundColor Green

# ── Step 2: Build frontend with Firebase + backend URL baked in ──────────────
Write-Host "`n>>> Building frontend image via Cloud Build..." -ForegroundColor Cyan

$subs = "_FB_API_KEY=$($fb['NEXT_PUBLIC_FIREBASE_API_KEY'])," +
        "_FB_AUTH_DOMAIN=$($fb['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'])," +
        "_FB_PROJECT_ID=$($fb['NEXT_PUBLIC_FIREBASE_PROJECT_ID'])," +
        "_FB_STORAGE_BUCKET=$($fb['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'])," +
        "_FB_MSG_SENDER_ID=$($fb['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'])," +
        "_FB_APP_ID=$($fb['NEXT_PUBLIC_FIREBASE_APP_ID'])," +
        "_API_URL=$BACKEND_URL"

gcloud builds submit (Join-Path $ROOT "frontend") `
    --config (Join-Path $ROOT "frontend\cloudbuild.yaml") `
    --substitutions $subs `
    --quiet

# ── Step 3: Deploy frontend ──────────────────────────────────────────────────
Write-Host "`n>>> Deploying frontend..." -ForegroundColor Cyan

gcloud run deploy dealradar-frontend `
    --image "gcr.io/$PROJECT_ID/dealradar-frontend:latest" `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 3000 `
    --min-instances 0 `
    --max-instances 3 `
    --quiet

$FRONTEND_URL = (gcloud run services describe dealradar-frontend --region $REGION --format "value(status.url)").Trim()
Write-Host "Frontend live: $FRONTEND_URL" -ForegroundColor Green

# ── Step 4: Cloud Scheduler cron ─────────────────────────────────────────────
Write-Host "`n>>> Setting up daily price-check cron (08:00 IST)..." -ForegroundColor Cyan

try {
    gcloud scheduler jobs create http dealradar-price-check `
        --location $REGION `
        --schedule "0 8 * * *" `
        --time-zone "Asia/Kolkata" `
        --uri "$BACKEND_URL/api/cron/price-check" `
        --http-method GET `
        --quiet 2>&1 | Out-Null
} catch {
    gcloud scheduler jobs update http dealradar-price-check `
        --location $REGION `
        --uri "$BACKEND_URL/api/cron/price-check" `
        --quiet 2>&1 | Out-Null
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  DealRadar deployed!" -ForegroundColor Yellow
Write-Host "  Frontend : $FRONTEND_URL" -ForegroundColor Yellow
Write-Host "  Backend  : $BACKEND_URL" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Yellow
