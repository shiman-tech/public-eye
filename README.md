# 🏙️ CivicPulse

**CivicPulse** is an open-source civic tech web application that empowers citizens to report local infrastructure issues and track their resolution in real-time — all on an interactive map.

Built on the **FARM stack**: **F**astAPI + **R**eact + **S**upabase (PostgreSQL).

![Tech Stack](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white) ![Leaflet](https://img.shields.io/badge/Leaflet.js-OpenStreetMap-199900?logo=leaflet&logoColor=white)

---

## Architecture

```
┌─────────────────┐     REST /api/*      ┌─────────────────┐
│  React (Vite)   │ ◄──────────────────► │  FastAPI        │
│  frontend/      │                      │  backend/       │
└────────┬────────┘                      └────────┬────────┘
         │                                        │
         │ Auth + Realtime                        │ Service role
         ▼                                        ▼
         └────────────────┬───────────────────────┘
                          │
                   ┌──────▼──────┐
                   │  Supabase   │
                   │  Postgres   │
                   │  Auth       │
                   │  Storage    │
                   │  Realtime   │
                   └─────────────┘
```

| Layer | Role |
|-------|------|
| **React** | UI, map, forms, admin Kanban |
| **FastAPI** | Reports CRUD, image upload, AI classification, geocoding proxy |
| **Supabase** | PostgreSQL + PostGIS database, admin auth, realtime subscriptions, image storage |

---

## ✨ Features

- 🗺️ Interactive map with click-to-report
- 🤖 AI image classification (OpenAI Vision via FastAPI)
- 📋 Public status board with audit trail
- 🔐 Admin Kanban dashboard
- ⚡ Real-time updates via Supabase Realtime
- 📱 Mobile-first responsive design

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Docker](https://docs.docker.com/get-docker/) (runs the FastAPI backend — no local Python needed)
- A [Supabase](https://supabase.com) project with PostGIS enabled

### 1. Clone & Install

```bash
git clone https://github.com/your-username/public-eye.git
cd public-eye
npm run install:all
```

This installs frontend dependencies only. The backend runs in Docker with a pinned Python 3.12 image and locked dependency versions.

### 2. Environment Variables

Copy the example files and fill in your credentials:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

**frontend/.env**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**backend/.env**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
CORS_ORIGINS=http://localhost:5173
```

> Get the service role key from Supabase Dashboard → Settings → API. Keep it server-side only.

### 3. Set Up the Database

In your [Supabase SQL Editor](https://supabase.com/dashboard), run:

```
supabase/schema.sql
```

Create a public storage bucket named **`report-images`** in Supabase Dashboard → Storage.

### 4. Run the App

```bash
npm run dev
```

This starts both servers concurrently (backend in Docker with hot reload):

| Service | URL |
|---------|-----|
| React frontend | http://localhost:5173 |
| FastAPI backend | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

Run individually:

```bash
npm run dev:backend   # Docker: FastAPI on :8000 (hot reload)
npm run dev:frontend  # Vite on :5173
```

### Docker commands

```bash
npm run dev:backend        # Dev: build + run with volume mount + reload
npm run dev:backend:down     # Stop dev container
npm run docker:build         # Rebuild backend image
npm run docker:prod          # Production image (no reload, detached)
npm run docker:prod:down     # Stop production container
```

Backend only (without npm):

```bash
docker compose up --build backend          # development
docker compose -f docker-compose.prod.yml up --build -d   # production
```

---

## 🔐 Admin Access

1. Create an admin user in Supabase Dashboard → Authentication → Users
2. Sign in at http://localhost:5173/login
3. Manage reports at `/admin`

Admin JWT tokens are sent to FastAPI for protected status-update routes.

---

## 📁 Project Structure

```
public-eye/
├── backend/                    # FastAPI (Python, Dockerized)
│   ├── Dockerfile              # Python 3.12, dev + prod targets
│   ├── app/
│   │   ├── main.py             # App entry + CORS
│   │   ├── auth.py             # JWT validation via Supabase
│   │   ├── routers/
│   │   │   ├── reports.py      # CRUD + status updates
│   │   │   ├── classify.py     # OpenAI Vision
│   │   │   └── geocode.py      # Nominatim proxy
│   │   └── services/
│   │       ├── ai_classifier.py
│   │       └── storage.py      # Supabase Storage uploads
│   └── requirements.txt
├── frontend/                   # React (Vite)
│   └── src/
│       ├── services/
│       │   ├── apiClient.js    # FastAPI HTTP client
│       │   ├── reportsService.js
│       │   ├── supabase.js     # Auth + Realtime only
│       │   ├── aiClassifier.js
│       │   └── geocodingService.js
│       ├── pages/
│       └── components/
├── supabase/
│   └── schema.sql              # Database schema + RLS
├── docker-compose.yml          # Dev backend (hot reload)
├── docker-compose.prod.yml     # Production backend
└── package.json                # Root scripts (dev both servers)
```

---

## 🔌 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/reports` | — | List all reports |
| POST | `/api/reports` | — | Submit report (multipart) |
| PATCH | `/api/reports/{id}/status` | Admin JWT | Update status + audit trail |
| GET | `/api/reports/{id}/history` | — | Status change history |
| POST | `/api/classify-image` | — | AI category suggestion |
| GET | `/api/geocode/reverse` | — | Reverse geocode lat/lng |

Interactive docs: http://localhost:8000/docs

---

## 📄 License

MIT — free to use, modify, and deploy for civic good.
