# 🛰️ DealRadar — B2B Arbitrage & Price Intelligence Platform

An enterprise-grade, high-performance intelligence platform that aggregates live B2B supplier data across 7 leading suppliers, calculates precise unit economics, predicts price movements using Google Gemini, performs arbitrage analysis via OpenAI GPT-4o, and automates multi-source watchlist tracking with daily price-drop alerts.

---

### 🚀 Technology Stack & Badges

🛡️ **Repository & Status**
[![GitHub repo size](https://img.shields.io/github/repo-size/Avi36005/DealRadar?style=for-the-badge&color=10b981)](https://github.com/Avi36005/DealRadar)
[![GitHub issues](https://img.shields.io/github/issues/Avi36005/DealRadar?style=for-the-badge&color=f43f5e)](https://github.com/Avi36005/DealRadar/issues)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](https://opensource.org/licenses/MIT)

💻 **Frontend Infrastructure**
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-F024B6?style=for-the-badge&logo=framermotion&logoColor=white)](https://motion.dev)
[![Recharts](https://img.shields.io/badge/Recharts-22B573?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://recharts.org)

⚙️ **Backend & Cloud Infrastructure**
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Firebase Auth & Firestore](https://img.shields.io/badge/Firebase_&_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Google Cloud Run](https://img.shields.io/badge/GCP_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Google Cloud Build](https://img.shields.io/badge/GCP_Cloud_Build-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/build)

🧠 **Artificial Intelligence & Alerts**
[![OpenAI GPT-4o](https://img.shields.io/badge/OpenAI_GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_Pro-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini)
[![Anakin.ai](https://img.shields.io/badge/Powered_by-Anakin.ai-FF6C37?style=for-the-badge&logo=rocket&logoColor=white)](https://anakin.ai)
[![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)](https://resend.com)

---

## ✨ Features Implemented

*   **Cinematic Landing Page:** Premium landing page with interactive Framer Motion animations, per-character staggered headings, custom SVG underline draws, and smooth scroll effects.
*   **Multi-Source Live Scraping (Anakin Wire):** Single unified product search across 7 major platforms powered by the **Anakin Wire API** with native currency normalizing (USD/INR conversion) for Indian B2B sources like Flipkart, IndiaMART, and BigBasket alongside standard USD sources (Amazon, Alibaba, Walmart, eBay, Etsy, Wayfair).
*   **Demand Radar (Trend Shock Prediction):** A predictive analytics dashboard highlighting emerging demand spikes, search query volume momentum, viral social media trends, and market risk analysis powered by Google Gemini Pro with OpenAI GPT-4o automatic fallback.
*   **AI Arbitrage Intelligence (GPT-4o):** Instant multi-dimensional B2B arbitrage evaluations to highlight gaps between supply/demand, margins, and target markets.
*   **Predictive Pricing (Gemini):** Machine-learning powered price trend predictions with percentage confidence scores.
*   **AI Auto-Email Generation:** Custom, ready-to-send draft email generator for supplier outreach, negotiations, or purchase orders.
*   **Multi-Source Interactive Charts:** Real-time multi-series price trend visualization built on top of `Recharts` with responsive layout coloring.
*   **Dynamic Unit Economics:** Real-time margin calculator reading last search results for automatic COGS evaluation (normalized to USD with dual INR/USD price tag visualizations), break-even calculations, and margin forecasts with CSV exports.
*   **Automated Watchlist Cron Alerts:** Isolated Firestore database keeping track of saved products, updating daily prices at 8:00 AM IST via **Google Cloud Scheduler** and **Cloud Run**, sending automatic alert emails through **Resend** upon price drops.

---

## 📁 Architecture & Folder Structure

```
DealRadar/
├── backend/                       # Express Node.js Backend Service
│   ├── lib/                       # Helper libraries & scraper routing
│   ├── server.js                  # Main server entrypoint (port 8000)
│   ├── Dockerfile                 # Backend deployment container specification
│   └── package.json               # Backend dependencies
├── frontend/                      # Next.js React Frontend Application
│   ├── src/
│   │   ├── app/                   # App Router pages, APIs, and dashboard layouts
│   │   ├── components/            # Sidebar, Topbar, MetricCards, Tables, loading bars
│   │   └── lib/                   # Firebase initialization, Firestore ops, Wire scraper config
│   ├── Dockerfile                 # Standalone multi-stage frontend container spec
│   ├── cloudbuild.yaml            # Google Cloud Build triggers pipeline
│   └── package.json               # Frontend dependencies
├── stitch_dealradar_intelligence_platform/ # UI mockups and design iteration resources
├── deploy.sh                      # Unix Cloud Run automatic deploy pipeline
└── deploy.ps1                     # Windows PowerShell Cloud Run automatic deploy pipeline
```

---

## 🔑 Environment Variables Setup

Create a `.env.local` inside `frontend/` and a `.env` inside `backend/` using the following templates:

### `frontend/.env.local`
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB9N_Me_U...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mediflow-nexus-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mediflow-nexus-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mediflow-nexus-2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=3692981377
NEXT_PUBLIC_FIREBASE_APP_ID=1:3692981377:web:a4058938fd2d2beefcf180

# Backend Connection (Development: http://localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Scraper & AI API keys
ANAKIN_WIRE_API_KEY=ask_4cea6c2f...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=fafb04c2...
RESEND_API_KEY=AQ.Ab8RN6Ir...
CRON_SECRET=dealradar-cron-2026
```

### `backend/.env`
```env
PORT=8000
ANAKIN_WIRE_API_KEY=ask_4cea6c2f...
GROQ_API_KEY=gsk_X8xEpPTT...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=fafb04c2...
GOOGLE_CLOUD_PROJECT=mediflow-nexus-2026
FIRESTORE_DATABASE_ID=dealradar
RESEND_API_KEY=AQ.Ab8RN6Ir...
CRON_SECRET=dealradar-cron-2026
```

---

## 🛠️ Local Installation & Development

To run the application locally on your computer:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Avi36005/DealRadar.git
    cd DealRadar/DealRadar
    ```

2.  **Start the Backend:**
    ```bash
    cd backend
    npm install
    npm start
    ```
    *The backend server runs on [http://localhost:8000](http://localhost:8000).*

3.  **Start the Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```
    *The Next.js development server runs on [http://localhost:3000](http://localhost:3000).*

---

## 🚀 One-Click Deployment Pipeline

DealRadar comes equipped with a 100% native Google Cloud Platform (GCP) deployment pipeline for both frontend and backend services.

### Deploying to Google Cloud Run (Fully Automated)

We provide platform-specific scripts to automate building Docker containers via Cloud Build, provision isolated Firestore instances, assign roles, deploy frontend/backend container services, and configure Cloud Scheduler cron triggers.

*   **For Windows (PowerShell):**
    ```powershell
    .\deploy.ps1
    ```

*   **For Linux/macOS (Bash):**
    Create a local `secrets.env` file containing the credentials listed in the environment section, then run:
    ```bash
    source secrets.env
    chmod +x deploy.sh
    ./deploy.sh
    ```

*   **Automated Watchlist Cron Job:**
    The pipeline automatically registers and updates a **Google Cloud Scheduler** job configured to run daily price checks via Cloud Run backend API endpoints secure-headers.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](https://opensource.org/licenses/MIT) for more information.
