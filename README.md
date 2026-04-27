# 🛡️ SportShield AI

> AI-powered sports media fingerprinting and IP protection platform

## Prerequisites

- **Docker** + **Docker Compose** v2
- **Node.js** 18+ (for local frontend dev)
- **Python** 3.11+ (for local backend dev)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/sportshield-ai.git
cd sportshield-ai

# 2. Copy environment config
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Open the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Demo Credentials

```
Email:    demo@sportshield.ai
Password: Demo1234!
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL   │
│  React + TS  │     │   FastAPI    │     │    15         │
│  Port 5173   │     │  Port 8000   │     │  Port 5432    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │              │
               ┌─────▼────┐  ┌─────▼────┐
               │  Celery   │  │  Redis   │
               │  Worker   │  │  7       │
               │  + Beat   │  │ Port 6379│
               └──────────┘  └──────────┘
```

## AI Pipeline

1. **Perceptual Hashing** — pHash + dHash via imagehash
2. **CNN Embeddings** — ResNet-50 2048-d feature vectors
3. **FAISS Index** — Exact nearest-neighbor search (IndexFlatL2)
4. **Video Processing** — Keyframe extraction every 2s via OpenCV/FFmpeg

## How It Works (End-to-End)

SportShield AI operates continuously in the background to protect your intellectual property. Here is the step-by-step workflow:

1. **Upload & Storage**: You upload a protected asset (image or video) via the React dashboard. The asset is securely saved to local storage (or S3).
2. **AI Fingerprinting**: A Celery background worker processes the asset, generating a Perceptual Hash (pHash) and a 512-dimensional CLIP semantic embedding. This creates a unique mathematical "fingerprint" for the asset.
3. **Continuous Scanning**: Scheduled background jobs query the internet (Google Images, Bing, YouTube) every 30 minutes searching for the asset's keywords or visual similarities.
4. **Two-Stage Detection**: 
   - **Stage 1 (Fast)**: Candidates are filtered by pHash distance (detects exact or slightly cropped copies).
   - **Stage 2 (Deep)**: Surviving candidates are analyzed via cosine similarity against the CLIP FAISS index (detects semantic copies, altered images, and text overlays).
5. **Violation Scoring**: The system assigns a confidence score (e.g., 94%) and a severity tier (HIGH, MEDIUM, LOW) based on the combined AI similarities.
6. **Real-Time Alerting**: If a match is found, the system instantly pushes a WebSocket event to your dashboard, triggers a toast notification, and sends an email via SendGrid.
7. **Takedown & Management**: You review the evidence on the dashboard and use the built-in Takedowns module to generate and track DMCA notices. Team Admins can manage access and roles seamlessly.

## Scanning Engines

- Google Custom Search JSON API
- Bing Image Search API v7
- SerpApi Google Lens (reverse image search)

## API Keys Setup

| Service | Key Name | Get Key |
|---------|----------|---------|
| Google Custom Search | `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` | [console.cloud.google.com](https://console.cloud.google.com) |
| Bing Image Search | `BING_API_KEY` | [azure.microsoft.com](https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/) |
| SerpApi | `SERPAPI_KEY` | [serpapi.com](https://serpapi.com) |
| SendGrid | `SENDGRID_API_KEY` | [sendgrid.com](https://sendgrid.com) |

## Project Structure

```
sportshield-ai/
├── frontend/          # React 18 + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route pages
│       ├── hooks/       # TanStack Query hooks
│       ├── lib/         # API client, auth, socket, PDF
│       └── types/       # TypeScript interfaces
├── backend/           # FastAPI + Python 3.11
│   └── app/
│       ├── ai/          # Fingerprinting pipeline
│       ├── scanner/     # Search engine scrapers
│       ├── tasks/       # Celery background tasks
│       ├── services/    # Business logic layer
│       ├── api/v1/      # REST API endpoints
│       └── models/      # SQLAlchemy ORM models
├── docker-compose.yml
└── .env.example
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2 (async), Celery 5, Redis 7 |
| AI/ML | PyTorch (ResNet-50), FAISS, imagehash |
| Database | PostgreSQL 15 |
| Real-time | Socket.IO (python-socketio) |
| Email | SendGrid |

## License

MIT
