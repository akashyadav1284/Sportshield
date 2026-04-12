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
