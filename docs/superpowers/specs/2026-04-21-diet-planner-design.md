# Diet Planner — Design Spec

**Date:** 2026-04-21
**Author:** Mohamed
**Status:** Approved

---

## Overview

A family diet planning web application where each family member has their own account. Users plan weekly meals, track calories and macros, manage recipes, generate shopping lists, log progress, and get AI-powered meal suggestions — all from a responsive web interface that works on desktop and mobile browsers. Built to run self-hosted on a home server via Docker Compose.

---

## Platform & Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + React Router v6 + React Query + Recharts |
| Backend | Python 3.11+ + FastAPI + SQLAlchemy (async) + Alembic |
| Database | PostgreSQL 15 |
| AI | Ollama (local LLM — llama3.2 default, configurable) |
| Deployment | Docker Compose (4 services: frontend, backend, db, ollama) |
| Auth | JWT tokens stored in httpOnly cookies |

---

## Features

1. **Weekly Meal Planner** — 7-day grid with 4 meal slots per day (breakfast, lunch, dinner, snack). Assign recipes or custom meals to each slot. Week navigation. One-click shopping list generation.
2. **Calorie & Macro Tracking** — Per-user daily calorie target calculated from profile (age, weight, height, goal, activity level). Dashboard shows eaten vs target ring + macro breakdown (protein, carbs, fat).
3. **Recipe Library** — Create, browse, search, and filter recipes. Each recipe stores ingredients (JSONB), instructions, nutrition info, and prep time. Recipes can be private (owner only) or public (visible to all family members).
4. **Shopping List** — Auto-generated from the active week's meal plan by aggregating all recipe ingredients. Grouped by category. Checkable items. Manual additions supported.
5. **Progress Tracking** — Daily weight and body fat logging. Line chart of weight over time. Calorie intake history bar chart (sourced from meal plan entries for that day — planned meals are treated as eaten in v1). Goal progress indicator.
6. **AI Meal Suggestions** — Chat-style interface powered by Ollama. FastAPI streams responses via SSE. User can describe preferences and restrictions; AI suggests meals. One-click to add a suggestion to the meal plan.

---

## Data Model

### `users`
```
id, email, hashed_password, name, avatar_url
age, gender, height_cm, weight_kg
goal (lose | maintain | gain)
activity_level (sedentary | light | moderate | active | very_active)
daily_calorie_target (computed on registration, editable)
created_at
```

### `recipes`
```
id, user_id (owner FK)
name, description, image_url
prep_time_min, servings
calories, protein_g, carbs_g, fat_g
ingredients (JSONB: [{name, quantity, unit}])
instructions (text)
is_public, created_at
```

### `meal_plans`
```
id, user_id (FK)
week_start_date (Monday of the week)
name
created_at
```

### `meal_plan_entries`
```
id, meal_plan_id (FK)
day_of_week (0=Mon … 6=Sun)
meal_type (breakfast | lunch | dinner | snack)
recipe_id (FK, nullable)
custom_meal_name (nullable, used when no recipe)
servings, calories_override
```

### `progress_logs`
```
id, user_id (FK)
logged_at (date, unique per user per day)
weight_kg, body_fat_pct (nullable)
notes
```

### `shopping_lists`
```
id, user_id (FK), meal_plan_id (FK)
generated_at
```

### `shopping_list_items`
```
id, shopping_list_id (FK)
ingredient_name, quantity, unit
category (produce | dairy | meat | grains | other)
is_checked
```

---

## API Endpoints

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

### Recipes
```
GET    /recipes?search=&meal_type=&max_calories=
GET    /recipes/{id}
POST   /recipes
PUT    /recipes/{id}
DELETE /recipes/{id}
```

### Meal Plans
```
GET    /meal-plans
POST   /meal-plans
GET    /meal-plans/{id}
POST   /meal-plans/{id}/entries
PUT    /meal-plans/{id}/entries/{entry_id}
DELETE /meal-plans/{id}/entries/{entry_id}
```

### Shopping Lists
```
POST   /meal-plans/{id}/shopping-list   ← generates from plan
GET    /shopping-lists/{id}
POST   /shopping-lists/{id}/items
PATCH  /shopping-lists/{id}/items/{item_id}   ← toggle checked / update
DELETE /shopping-lists/{id}/items/{item_id}
```

### Progress
```
GET    /progress?from=&to=
POST   /progress
DELETE /progress/{id}
```

### AI
```
POST   /ai/suggest
Body:  { message: string, context: { goal, daily_calorie_target, restrictions[] } }
Response: SSE stream (text/event-stream) — real-time token output from Ollama
```

All endpoints except `/auth/register` and `/auth/login` require a valid JWT.  
All data is scoped to `current_user.id` — users cannot access other users' data except public recipes.

---

## Frontend Structure

```
frontend/
  src/
    pages/
      Dashboard.tsx          ← today's summary, calorie ring, macro bar
      MealPlanner.tsx        ← weekly grid, slot assignment modal
      Recipes.tsx            ← browse + search
      RecipeDetail.tsx       ← view/edit single recipe
      ShoppingList.tsx       ← checklist view
      Progress.tsx           ← charts + log form
      AISuggestions.tsx      ← chat UI with SSE streaming
      Profile.tsx            ← edit user settings/goals
      Login.tsx
      Register.tsx
    components/
      CalorieRing.tsx
      MacroBar.tsx
      WeekGrid.tsx
      MealSlot.tsx
      RecipeCard.tsx
      ChatMessage.tsx
    lib/
      api.ts                 ← axios instance with JWT interceptor
      auth.ts
```

---

## Backend Structure

```
backend/
  app/
    routers/
      auth.py
      recipes.py
      meal_plans.py
      shopping_lists.py
      progress.py
      ai.py
    models/          ← SQLAlchemy ORM models
    schemas/         ← Pydantic v2 request/response models
    services/        ← business logic (calorie calc, shopping list aggregation)
    ai/
      client.py      ← httpx async client for Ollama /api/chat
      prompts.py     ← system prompt + context builder
    core/
      auth.py        ← JWT creation/validation
      config.py      ← settings from env vars
      database.py    ← async SQLAlchemy engine
  alembic/           ← migrations
  Dockerfile
```

---

## Docker Compose Services

```yaml
services:
  frontend:   React app built by Vite, served by Nginx (port 80)
  backend:    FastAPI with uvicorn (port 8000)
  db:         PostgreSQL 15 (port 5432, internal only)
  ollama:     Ollama (port 11434, internal only), pulls llama3.2 on first start
```

Environment variables (`.env` file):
```
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET=...
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2
```

---

## AI Integration Detail

- FastAPI `/ai/suggest` receives the user message + profile context
- `prompts.py` builds a system prompt including the user's goal, calorie target, and any dietary restrictions
- `client.py` sends to `Ollama /api/chat` with `stream=true`
- FastAPI streams the response back to React as Server-Sent Events
- React renders tokens progressively in the chat UI
- A "Add to meal plan" button appears after the full response, pre-filling the meal planner

---

## Auth Flow

1. Register: submit email + password + profile → receive JWT cookie
2. Login: submit credentials → receive JWT cookie (httpOnly, SameSite=strict)
3. All API requests include the cookie automatically
4. Protected routes in React redirect to `/login` if no valid session

---

## Out of Scope (v1)

- Push notifications / meal reminders
- Native mobile app (future upgrade path)
- Social / sharing features between families
- Barcode scanning for food logging
- Integration with external nutrition databases (e.g. USDA)
