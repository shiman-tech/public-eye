# 🏙️ PublicEye

**PublicEye** is an open-source civic tech web application that empowers citizens to report local infrastructure issues and track their resolution in real-time — all on an interactive map.

Built on the **NERM / PERN stack**: **N**ode.js (**E**xpress) + **R**eact + **S**upabase (PostgreSQL).

![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white) ![Leaflet](https://img.shields.io/badge/Leaflet.js-OpenStreetMap-199900?logo=leaflet&logoColor=white)

---

## Architecture

```
┌─────────────────┐     REST /api/*      ┌─────────────────┐
│  React (Vite)   │ ◄──────────────────► │  Node.js        │
│  frontend/      │                      │  Express        │
│                 │                      │  backend/       │
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
| **Node.js / Express** | Reports CRUD, image upload, AI classification, geocoding proxy |
| **Supabase** | PostgreSQL + PostGIS database, admin auth, realtime subscriptions, image storage |

---

## ✨ Features

- 🗺️ Interactive map with click-to-report
- 🤖 AI image classification (OpenAI Vision via Express backend)
- 📋 Public status board with audit trail
- 🔐 Admin Kanban dashboard
- ⚡ Real-time updates via Supabase Realtime
- 📱 Mobile-first responsive design

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Docker](https://docs.docker.com/get-docker/) (optional if running containers)
- A [Supabase](https://supabase.com) project with PostGIS enabled

### 1. Clone & Install

```bash
git clone https://github.com/your-username/public-eye.git
cd public-eye
npm run install:all
```

This installs both backend and frontend dependencies.

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
PORT=8000
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

This starts both servers concurrently:

| Service | URL |
|---------|-----|
| React frontend | http://localhost:5173 |
| Express backend | http://localhost:8000 |

Run individually:

```bash
npm run dev:backend   # Express on :8000 (hot reload with nodemon)
npm run dev:frontend  # Vite on :5173
```

### Docker commands

```bash
npm run dev:backend:docker   # Dev: build + run with volume mount + reload
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

Admin JWT tokens are sent to Express for protected status-update routes. The backend verifies the token and dynamically instantiates a database client authenticated with the admin's JWT token (retrieved from the `Authorization` bearer header). This allows backend database operations to execute under the `authenticated` role, satisfying Row Level Security (RLS) policies defined in PostgreSQL (such as those requiring authenticated status for report updates and history entry creation).

---

## 📁 Project Structure

```
public-eye/
├── backend/                    # Node.js Express Backend
│   ├── Dockerfile              # Node 20 alpine, dev + prod targets
│   ├── package.json
│   ├── src/
│   │   ├── server.js           # Express app entry + CORS
│   │   ├── config.js           # Env config
│   │   ├── db.js               # Supabase JS clients
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT validation via Supabase
│   │   ├── routes/
│   │   │   ├── reports.js      # CRUD + status updates
│   │   │   ├── classify.js     # OpenAI Vision
│   │   │   └── geocode.js      # Nominatim proxy
│   │   └── services/
│   │       ├── aiClassifier.js
│   │       └── storage.js      # Supabase Storage uploads
├── frontend/                   # React (Vite)
│   └── src/
│       ├── services/
│       │   ├── apiClient.js    # Backend HTTP client
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
