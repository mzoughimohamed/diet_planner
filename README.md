# Diet Planner

A self-hosted family diet planning web app. Each family member has their own account to plan weekly meals, track calories and macros, manage recipes, generate shopping lists, log progress, and get AI-powered meal suggestions.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router v6, TanStack Query v5, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy (async), Alembic |
| Database | PostgreSQL 15 |
| AI | Ollama (local LLM — llama3.2, runs on your machine) |
| Deployment | Docker Compose |

## Features

- **Weekly Meal Planner** — 7-day grid with breakfast, lunch, dinner, and snack slots
- **Calorie & Macro Tracking** — Daily calorie target calculated from your profile, with a visual ring and macro breakdown
- **Recipe Library** — Create, search, and filter recipes with full nutrition info and ingredient lists
- **Shopping List** — Auto-generated from your meal plan, grouped by category, with manual additions
- **Progress Tracking** — Log daily weight and body fat, view a weight chart over time
- **AI Meal Suggestions** — Chat with a local Ollama LLM for meal ideas based on your goals

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- ~4 GB free disk space (for the llama3.2 model)

### 1. Clone and configure

```bash
git clone <repo-url>
cd "Diet Planner"
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET`:

```env
DATABASE_URL=postgresql+asyncpg://diet:diet_secret@db:5432/dietplanner
JWT_SECRET=change-me-to-a-random-secret
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2
POSTGRES_USER=diet
POSTGRES_PASSWORD=diet_secret
POSTGRES_DB=dietplanner
```

### 2. Start

```bash
docker compose up --build -d
```

All four services start: `frontend` (port 80), `backend` (port 8000), `db`, and `ollama`.

> **First start:** Ollama will pull the llama3.2 model (~2 GB). The AI chat page won't respond until the download finishes. Check progress with `docker compose logs ollama -f`.

### 3. Open

Navigate to **http://localhost** and register your account.

## Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run with SQLite (no Docker needed for dev)
DATABASE_URL=sqlite+aiosqlite:///./dev.db JWT_SECRET=dev uvicorn app.main:app --reload --port 8000
```

Run tests:

```bash
pytest
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # dev server at http://localhost:5173, proxies API to localhost:8000
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, recipes, meal_plans, shopping_lists, progress, ai
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic v2 request/response schemas
│   │   ├── services/       # nutrition calc, shopping list aggregation
│   │   ├── ai/             # Ollama SSE client + prompt builder
│   │   └── core/           # JWT auth, config, database session
│   ├── alembic/            # database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, MealPlanner, Recipes, ShoppingList, Progress, AISuggestions, Profile, Login, Register
│       ├── components/     # CalorieRing, MacroBar, MealSlot, RecipeCard, ChatMessage, Layout
│       ├── lib/            # axios client, TypeScript types
│       └── contexts/       # AuthContext (React Query-backed)
└── docker-compose.yml
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `OLLAMA_HOST` | Ollama API base URL |
| `OLLAMA_MODEL` | Model to use (default: `llama3.2`) |
| `JWT_EXPIRE_MINUTES` | Token lifetime in minutes (default: `10080` = 7 days) |
