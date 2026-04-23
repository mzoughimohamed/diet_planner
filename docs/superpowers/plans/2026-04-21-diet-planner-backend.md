# Diet Planner Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully-tested FastAPI backend with PostgreSQL, JWT cookie auth, REST endpoints for all 6 features, and Ollama AI streaming integration — all runnable via Docker Compose.

**Architecture:** FastAPI async application with SQLAlchemy 2.0 async ORM and Pydantic v2. One router per resource. JWT stored in httpOnly cookies. Ollama integration streams tokens via Server-Sent Events. Tests use SQLite in-memory so they run without Docker.

**Tech Stack:** Python 3.11, FastAPI 0.111, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 15, Pydantic v2, python-jose[cryptography], passlib[bcrypt], httpx, aiosqlite, pytest, pytest-asyncio, httpx (AsyncClient)

---

## File Map

```
Diet Planner/
  docker-compose.yml
  .env.example
  backend/
    Dockerfile
    requirements.txt
    alembic.ini
    alembic/
      env.py
      versions/
        0001_initial.py
    app/
      main.py
      core/
        config.py
        database.py
        auth.py
      models/
        __init__.py
        user.py
        recipe.py
        meal_plan.py
        shopping_list.py
        progress.py
      schemas/
        __init__.py
        user.py
        recipe.py
        meal_plan.py
        shopping_list.py
        progress.py
        ai.py
      routers/
        __init__.py
        auth.py
        recipes.py
        meal_plans.py
        shopping_lists.py
        progress.py
        ai.py
      services/
        nutrition.py
        shopping.py
      ai/
        client.py
        prompts.py
    tests/
      conftest.py
      test_auth.py
      test_recipes.py
      test_meal_plans.py
      test_shopping_lists.py
      test_progress.py
      test_ai.py
```

---

## Task 1: Project Structure + Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
# docker-compose.yml
version: "3.9"

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      ollama:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: diet
      POSTGRES_PASSWORD: diet_secret
      POSTGRES_DB: dietplanner
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U diet -d dietplanner"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    restart: unless-stopped
    entrypoint: ["/bin/sh", "-c", "ollama serve & sleep 5 && ollama pull llama3.2 && wait"]

volumes:
  postgres_data:
  ollama_data:
```

- [ ] **Step 2: Create .env.example**

```bash
# .env.example
DATABASE_URL=postgresql+asyncpg://diet:diet_secret@db:5432/dietplanner
JWT_SECRET=change-this-to-a-random-secret-at-least-32-chars
JWT_EXPIRE_MINUTES=10080
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2
```

Copy to `.env` and fill in your JWT_SECRET:
```bash
cp .env.example .env
```

- [ ] **Step 3: Create backend/Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 4: Create backend/requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.1
pydantic[email]==2.7.1
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.27.0
aiosqlite==0.20.0
pytest==8.2.0
pytest-asyncio==0.23.6
```

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/moham/Documents/Diet Planner"
git init
git add docker-compose.yml .env.example backend/Dockerfile backend/requirements.txt
git commit -m "feat: add project structure and Docker Compose"
```

---

## Task 2: FastAPI Skeleton + Config

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/ai/__init__.py`

- [ ] **Step 1: Create all __init__.py files**

```bash
touch backend/app/__init__.py
touch backend/app/core/__init__.py
touch backend/app/routers/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/services/__init__.py
touch backend/app/ai/__init__.py
touch backend/tests/__init__.py
```

- [ ] **Step 2: Create backend/app/core/config.py**

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 3: Create backend/app/main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, recipes, meal_plans, shopping_lists, progress, ai

app = FastAPI(title="Diet Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
app.include_router(meal_plans.router, prefix="/meal-plans", tags=["meal-plans"])
app.include_router(shopping_lists.router, prefix="/shopping-lists", tags=["shopping-lists"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Create stub routers so the app imports without error**

Create `backend/app/routers/auth.py`, `recipes.py`, `meal_plans.py`, `shopping_lists.py`, `progress.py`, `ai.py` each with just:

```python
# backend/app/routers/auth.py  (repeat same stub for each file, changing variable name)
from fastapi import APIRouter
router = APIRouter()
```

- [ ] **Step 5: Verify the app starts**

```bash
cd backend
pip install -r requirements.txt
DATABASE_URL=sqlite+aiosqlite:///./test.db JWT_SECRET=testsecret uvicorn app.main:app --port 8000
```

Expected: `Application startup complete.` at http://localhost:8000/health → `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add backend/app/
git commit -m "feat: FastAPI skeleton with config and stub routers"
```

---

## Task 3: Database Setup + SQLAlchemy Models

**Files:**
- Create: `backend/app/core/database.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/recipe.py`
- Create: `backend/app/models/meal_plan.py`
- Create: `backend/app/models/shopping_list.py`
- Create: `backend/app/models/progress.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create backend/app/core/database.py**

```python
# backend/app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 2: Create backend/app/models/user.py**

```python
# backend/app/models/user.py
from datetime import datetime
from sqlalchemy import DateTime, Enum, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import enum


class Goal(str, enum.Enum):
    lose = "lose"
    maintain = "maintain"
    gain = "gain"


class ActivityLevel(str, enum.Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"
    very_active = "very_active"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal: Mapped[str] = mapped_column(String(20), default="maintain")
    activity_level: Mapped[str] = mapped_column(String(20), default="moderate")
    daily_calorie_target: Mapped[int] = mapped_column(Integer, default=2000)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 3: Create backend/app/models/recipe.py**

```python
# backend/app/models/recipe.py
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    prep_time_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int] = mapped_column(Integer, default=1)
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)
    ingredients: Mapped[list] = mapped_column(JSON, default=list)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 4: Create backend/app/models/meal_plan.py**

```python
# backend/app/models/meal_plan.py
from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Float, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meal_plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon, 6=Sun
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)  # breakfast|lunch|dinner|snack
    recipe_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)
    custom_meal_name: Mapped[str | None] = mapped_column(String, nullable=True)
    servings: Mapped[float] = mapped_column(Float, default=1.0)
    calories_override: Mapped[float | None] = mapped_column(Float, nullable=True)
```

- [ ] **Step 5: Create backend/app/models/shopping_list.py**

```python
# backend/app/models/shopping_list.py
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Float, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shopping_list_id: Mapped[int] = mapped_column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False)
    ingredient_name: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="other")
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False)
```

- [ ] **Step 6: Create backend/app/models/progress.py**

```python
# backend/app/models/progress.py
from datetime import date
from sqlalchemy import Date, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ProgressLog(Base):
    __tablename__ = "progress_logs"
    __table_args__ = (UniqueConstraint("user_id", "logged_at", name="uq_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    logged_at: Mapped[date] = mapped_column(Date, nullable=False)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
```

- [ ] **Step 7: Update backend/app/models/__init__.py**

```python
# backend/app/models/__init__.py
from app.models.user import User
from app.models.recipe import Recipe
from app.models.meal_plan import MealPlan, MealPlanEntry
from app.models.shopping_list import ShoppingList, ShoppingListItem
from app.models.progress import ProgressLog
```

- [ ] **Step 8: Commit**

```bash
git add backend/app/core/database.py backend/app/models/
git commit -m "feat: add SQLAlchemy models for all entities"
```

---

## Task 4: Alembic Migrations

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/0001_initial.py`

- [ ] **Step 1: Create backend/alembic.ini**

```ini
# backend/alembic.ini
[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = driver://user:pass@localhost/dbname
```

- [ ] **Step 2: Create backend/alembic/env.py**

```python
# backend/alembic/env.py
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.core.config import settings
from app.models import *  # noqa: F401 — registers all models
from app.core.database import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create backend/alembic/versions/0001_initial.py**

```python
# backend/alembic/versions/0001_initial.py
"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-21
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String, unique=True, nullable=False),
        sa.Column("hashed_password", sa.String, nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("avatar_url", sa.String, nullable=True),
        sa.Column("age", sa.Integer, nullable=True),
        sa.Column("gender", sa.String(10), nullable=True),
        sa.Column("height_cm", sa.Float, nullable=True),
        sa.Column("weight_kg", sa.Float, nullable=True),
        sa.Column("goal", sa.String(20), server_default="maintain"),
        sa.Column("activity_level", sa.String(20), server_default="moderate"),
        sa.Column("daily_calorie_target", sa.Integer, server_default="2000"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("image_url", sa.String, nullable=True),
        sa.Column("prep_time_min", sa.Integer, nullable=True),
        sa.Column("servings", sa.Integer, server_default="1"),
        sa.Column("calories", sa.Float, server_default="0"),
        sa.Column("protein_g", sa.Float, server_default="0"),
        sa.Column("carbs_g", sa.Float, server_default="0"),
        sa.Column("fat_g", sa.Float, server_default="0"),
        sa.Column("ingredients", sa.JSON, server_default="[]"),
        sa.Column("instructions", sa.Text, nullable=True),
        sa.Column("is_public", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "meal_plans",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_start_date", sa.Date, nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "meal_plan_entries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("meal_plan_id", sa.Integer, sa.ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("meal_type", sa.String(20), nullable=False),
        sa.Column("recipe_id", sa.Integer, sa.ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("custom_meal_name", sa.String, nullable=True),
        sa.Column("servings", sa.Float, server_default="1"),
        sa.Column("calories_override", sa.Float, nullable=True),
    )
    op.create_table(
        "shopping_lists",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("meal_plan_id", sa.Integer, sa.ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("generated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "shopping_list_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("shopping_list_id", sa.Integer, sa.ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ingredient_name", sa.String, nullable=False),
        sa.Column("quantity", sa.Float, nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("category", sa.String(50), server_default="other"),
        sa.Column("is_checked", sa.Boolean, server_default="false"),
    )
    op.create_table(
        "progress_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("logged_at", sa.Date, nullable=False),
        sa.Column("weight_kg", sa.Float, nullable=True),
        sa.Column("body_fat_pct", sa.Float, nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.UniqueConstraint("user_id", "logged_at", name="uq_user_date"),
    )


def downgrade() -> None:
    op.drop_table("progress_logs")
    op.drop_table("shopping_list_items")
    op.drop_table("shopping_lists")
    op.drop_table("meal_plan_entries")
    op.drop_table("meal_plans")
    op.drop_table("recipes")
    op.drop_table("users")
```

- [ ] **Step 4: Commit**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat: add Alembic migrations for initial schema"
```

---

## Task 5: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/schemas/recipe.py`
- Create: `backend/app/schemas/meal_plan.py`
- Create: `backend/app/schemas/shopping_list.py`
- Create: `backend/app/schemas/progress.py`
- Create: `backend/app/schemas/ai.py`
- Modify: `backend/app/schemas/__init__.py`

- [ ] **Step 1: Create backend/app/schemas/user.py**

```python
# backend/app/schemas/user.py
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    goal: str = "maintain"
    activity_level: str = "moderate"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    goal: str | None = None
    activity_level: str | None = None
    daily_calorie_target: int | None = None


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: str | None
    age: int | None
    gender: str | None
    height_cm: float | None
    weight_kg: float | None
    goal: str
    activity_level: str
    daily_calorie_target: int
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Create backend/app/schemas/recipe.py**

```python
# backend/app/schemas/recipe.py
from datetime import datetime
from pydantic import BaseModel


class IngredientItem(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None


class RecipeCreate(BaseModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    prep_time_min: int | None = None
    servings: int = 1
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    ingredients: list[IngredientItem] = []
    instructions: str | None = None
    is_public: bool = False


class RecipeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    prep_time_min: int | None = None
    servings: int | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    ingredients: list[IngredientItem] | None = None
    instructions: str | None = None
    is_public: bool | None = None


class RecipeOut(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    image_url: str | None
    prep_time_min: int | None
    servings: int
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    ingredients: list
    instructions: str | None
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Create backend/app/schemas/meal_plan.py**

```python
# backend/app/schemas/meal_plan.py
from datetime import date, datetime
from pydantic import BaseModel


class MealPlanCreate(BaseModel):
    week_start_date: date
    name: str


class MealPlanOut(BaseModel):
    id: int
    user_id: int
    week_start_date: date
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MealPlanEntryCreate(BaseModel):
    day_of_week: int  # 0-6
    meal_type: str    # breakfast|lunch|dinner|snack
    recipe_id: int | None = None
    custom_meal_name: str | None = None
    servings: float = 1.0
    calories_override: float | None = None


class MealPlanEntryUpdate(BaseModel):
    recipe_id: int | None = None
    custom_meal_name: str | None = None
    servings: float | None = None
    calories_override: float | None = None


class MealPlanEntryOut(BaseModel):
    id: int
    meal_plan_id: int
    day_of_week: int
    meal_type: str
    recipe_id: int | None
    custom_meal_name: str | None
    servings: float
    calories_override: float | None

    model_config = {"from_attributes": True}


class MealPlanDetail(MealPlanOut):
    entries: list[MealPlanEntryOut] = []
```

- [ ] **Step 4: Create backend/app/schemas/shopping_list.py**

```python
# backend/app/schemas/shopping_list.py
from datetime import datetime
from pydantic import BaseModel


class ShoppingListItemCreate(BaseModel):
    ingredient_name: str
    quantity: float | None = None
    unit: str | None = None
    category: str = "other"


class ShoppingListItemUpdate(BaseModel):
    is_checked: bool | None = None
    quantity: float | None = None
    unit: str | None = None


class ShoppingListItemOut(BaseModel):
    id: int
    shopping_list_id: int
    ingredient_name: str
    quantity: float | None
    unit: str | None
    category: str
    is_checked: bool

    model_config = {"from_attributes": True}


class ShoppingListOut(BaseModel):
    id: int
    user_id: int
    meal_plan_id: int
    generated_at: datetime
    items: list[ShoppingListItemOut] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Create backend/app/schemas/progress.py**

```python
# backend/app/schemas/progress.py
from datetime import date
from pydantic import BaseModel


class ProgressLogCreate(BaseModel):
    logged_at: date
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    notes: str | None = None


class ProgressLogOut(BaseModel):
    id: int
    user_id: int
    logged_at: date
    weight_kg: float | None
    body_fat_pct: float | None
    notes: str | None

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create backend/app/schemas/ai.py**

```python
# backend/app/schemas/ai.py
from pydantic import BaseModel


class AIContext(BaseModel):
    goal: str
    daily_calorie_target: int
    restrictions: list[str] = []


class AISuggestRequest(BaseModel):
    message: str
    context: AIContext
```

- [ ] **Step 7: Update backend/app/schemas/__init__.py**

```python
# backend/app/schemas/__init__.py
from app.schemas.user import UserRegister, UserLogin, UserUpdate, UserOut
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeOut, IngredientItem
from app.schemas.meal_plan import MealPlanCreate, MealPlanOut, MealPlanEntryCreate, MealPlanEntryUpdate, MealPlanEntryOut, MealPlanDetail
from app.schemas.shopping_list import ShoppingListOut, ShoppingListItemCreate, ShoppingListItemUpdate, ShoppingListItemOut
from app.schemas.progress import ProgressLogCreate, ProgressLogOut
from app.schemas.ai import AISuggestRequest, AIContext
```

- [ ] **Step 8: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic v2 schemas for all resources"
```

---

## Task 6: Auth Utilities + Nutrition Service

**Files:**
- Create: `backend/app/core/auth.py`
- Create: `backend/app/services/nutrition.py`

- [ ] **Step 1: Create backend/app/core/auth.py**

```python
# backend/app/core/auth.py
from datetime import datetime, timedelta, timezone
from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.jwt_secret, algorithm=ALGORITHM)


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if not access_token:
        raise credentials_exc
    try:
        payload = jwt.decode(access_token, settings.jwt_secret, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise credentials_exc
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exc
    return user
```

- [ ] **Step 2: Create backend/app/services/nutrition.py**

```python
# backend/app/services/nutrition.py


def calculate_daily_calories(
    weight_kg: float | None,
    height_cm: float | None,
    age: int | None,
    gender: str | None,
    activity_level: str,
    goal: str,
) -> int:
    """Mifflin-St Jeor equation."""
    if not all([weight_kg, height_cm, age, gender]):
        return 2000

    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }
    tdee = bmr * multipliers.get(activity_level, 1.55)

    adjustments = {"lose": -500, "maintain": 0, "gain": 500}
    return round(tdee + adjustments.get(goal, 0))
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/auth.py backend/app/services/nutrition.py
git commit -m "feat: add JWT auth utilities and nutrition calculator"
```

---

## Task 7: Auth Router

**Files:**
- Modify: `backend/app/routers/auth.py`

- [ ] **Step 1: Replace stub with full auth router**

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import create_access_token, get_current_user, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserLogin, UserOut, UserRegister, UserUpdate
from app.services.nutrition import calculate_daily_calories

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    calories = calculate_daily_calories(
        body.weight_kg, body.height_cm, body.age, body.gender, body.activity_level, body.goal
    )
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        age=body.age,
        gender=body.gender,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        goal=body.goal,
        activity_level=body.activity_level,
        daily_calorie_target=calories,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id)
    response.set_cookie("access_token", token, httponly=True, samesite="strict", max_age=60 * 60 * 24 * 7)
    return user


@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    response.set_cookie("access_token", token, httponly=True, samesite="strict", max_age=60 * 60 * 24 * 7)
    return user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    if any(f in body.model_dump(exclude_none=True) for f in ["weight_kg", "height_cm", "age", "gender", "activity_level", "goal"]):
        current_user.daily_calorie_target = calculate_daily_calories(
            current_user.weight_kg, current_user.height_cm, current_user.age,
            current_user.gender, current_user.activity_level, current_user.goal,
        )
    await db.commit()
    await db.refresh(current_user)
    return current_user
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/routers/auth.py
git commit -m "feat: implement auth router (register, login, logout, me)"
```

---

## Task 8: Test Setup + Auth Tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`
- Create: `backend/pytest.ini`

- [ ] **Step 1: Create backend/pytest.ini**

```ini
[pytest]
asyncio_mode = auto
```

- [ ] **Step 2: Create backend/tests/conftest.py**

```python
# backend/tests/conftest.py
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_diet.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def auth_client(client):
    """Returns a client already logged in as a test user."""
    await client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "weight_kg": 75,
        "height_cm": 175,
        "age": 30,
        "gender": "male",
        "goal": "maintain",
        "activity_level": "moderate",
    })
    return client
```

- [ ] **Step 3: Write failing auth tests**

```python
# backend/tests/test_auth.py
import pytest


async def test_register_success(client):
    response = await client.post("/auth/register", json={
        "email": "user@example.com",
        "password": "secret123",
        "name": "Alice",
        "weight_kg": 65,
        "height_cm": 165,
        "age": 28,
        "gender": "female",
        "goal": "lose",
        "activity_level": "light",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user@example.com"
    assert data["name"] == "Alice"
    assert data["daily_calorie_target"] > 0
    assert "access_token" in response.cookies


async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass", "name": "Bob"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 400


async def test_login_success(client):
    await client.post("/auth/register", json={"email": "login@example.com", "password": "pass123", "name": "Carol"})
    response = await client.post("/auth/login", json={"email": "login@example.com", "password": "pass123"})
    assert response.status_code == 200
    assert "access_token" in response.cookies


async def test_login_wrong_password(client):
    await client.post("/auth/register", json={"email": "pw@example.com", "password": "right", "name": "Dave"})
    response = await client.post("/auth/login", json={"email": "pw@example.com", "password": "wrong"})
    assert response.status_code == 401


async def test_me_authenticated(auth_client):
    response = await auth_client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


async def test_me_unauthenticated(client):
    response = await client.get("/auth/me")
    assert response.status_code == 401
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/ backend/pytest.ini
git commit -m "test: add auth tests — all passing"
```

---

## Task 9: Recipes Router + Tests

**Files:**
- Modify: `backend/app/routers/recipes.py`
- Create: `backend/tests/test_recipes.py`

- [ ] **Step 1: Replace stub with full recipes router**

```python
# backend/app/routers/recipes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeOut, RecipeUpdate

router = APIRouter()


@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    search: str | None = None,
    meal_type: str | None = None,
    max_calories: float | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Recipe).where(
        or_(Recipe.user_id == current_user.id, Recipe.is_public == True)  # noqa: E712
    )
    if search:
        q = q.where(Recipe.name.ilike(f"%{search}%"))
    if max_calories is not None:
        q = q.where(Recipe.calories <= max_calories)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.user_id != current_user.id and not recipe.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    return recipe


@router.post("", response_model=RecipeOut, status_code=201)
async def create_recipe(
    body: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = Recipe(
        user_id=current_user.id,
        **body.model_dump(),
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.put("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: int,
    body: RecipeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(recipe, field, value)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    await db.delete(recipe)
    await db.commit()
```

- [ ] **Step 2: Write recipe tests**

```python
# backend/tests/test_recipes.py
import pytest


async def test_create_recipe(auth_client):
    response = await auth_client.post("/recipes", json={
        "name": "Oatmeal",
        "calories": 350,
        "protein_g": 12,
        "carbs_g": 60,
        "fat_g": 7,
        "servings": 1,
        "ingredients": [{"name": "Oats", "quantity": 100, "unit": "g"}],
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Oatmeal"


async def test_list_recipes_includes_own(auth_client):
    await auth_client.post("/recipes", json={"name": "Salad", "calories": 200})
    response = await auth_client.get("/recipes")
    assert response.status_code == 200
    names = [r["name"] for r in response.json()]
    assert "Salad" in names


async def test_get_recipe(auth_client):
    created = (await auth_client.post("/recipes", json={"name": "Toast", "calories": 150})).json()
    response = await auth_client.get(f"/recipes/{created['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Toast"


async def test_update_recipe(auth_client):
    created = (await auth_client.post("/recipes", json={"name": "Old Name", "calories": 100})).json()
    response = await auth_client.put(f"/recipes/{created['id']}", json={"name": "New Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_delete_recipe(auth_client):
    created = (await auth_client.post("/recipes", json={"name": "Delete Me", "calories": 100})).json()
    response = await auth_client.delete(f"/recipes/{created['id']}")
    assert response.status_code == 204
    response = await auth_client.get(f"/recipes/{created['id']}")
    assert response.status_code == 404


async def test_search_recipes(auth_client):
    await auth_client.post("/recipes", json={"name": "Chicken Soup", "calories": 400})
    await auth_client.post("/recipes", json={"name": "Beef Stew", "calories": 500})
    response = await auth_client.get("/recipes?search=chicken")
    assert response.status_code == 200
    assert all("chicken" in r["name"].lower() for r in response.json())
```

- [ ] **Step 3: Run tests**

```bash
cd backend
pytest tests/test_recipes.py -v
```

Expected: all 6 tests PASS

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/recipes.py backend/tests/test_recipes.py
git commit -m "feat: recipes CRUD router with tests"
```

---

## Task 10: Meal Plans Router + Tests

**Files:**
- Modify: `backend/app/routers/meal_plans.py`
- Create: `backend/tests/test_meal_plans.py`

- [ ] **Step 1: Replace stub with full meal plans router**

```python
# backend/app/routers/meal_plans.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.meal_plan import MealPlan, MealPlanEntry
from app.models.user import User
from app.schemas.meal_plan import (
    MealPlanCreate, MealPlanDetail, MealPlanEntryCreate,
    MealPlanEntryOut, MealPlanEntryUpdate, MealPlanOut,
)

router = APIRouter()


@router.get("", response_model=list[MealPlanOut])
async def list_meal_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MealPlan).where(MealPlan.user_id == current_user.id))
    return result.scalars().all()


@router.post("", response_model=MealPlanOut, status_code=201)
async def create_meal_plan(
    body: MealPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = MealPlan(user_id=current_user.id, **body.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=MealPlanDetail)
async def get_meal_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    entries_result = await db.execute(select(MealPlanEntry).where(MealPlanEntry.meal_plan_id == plan_id))
    entries = entries_result.scalars().all()
    return MealPlanDetail.model_validate({**plan.__dict__, "entries": entries})


@router.post("/{plan_id}/entries", response_model=MealPlanEntryOut, status_code=201)
async def add_entry(
    plan_id: int,
    body: MealPlanEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meal plan not found")
    entry = MealPlanEntry(meal_plan_id=plan_id, **body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{plan_id}/entries/{entry_id}", response_model=MealPlanEntryOut)
async def update_entry(
    plan_id: int,
    entry_id: int,
    body: MealPlanEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MealPlanEntry).join(MealPlan).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan_id,
            MealPlan.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{plan_id}/entries/{entry_id}", status_code=204)
async def delete_entry(
    plan_id: int,
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MealPlanEntry).join(MealPlan).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan_id,
            MealPlan.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()
```

- [ ] **Step 2: Write meal plan tests**

```python
# backend/tests/test_meal_plans.py
import pytest
from datetime import date


async def test_create_meal_plan(auth_client):
    response = await auth_client.post("/meal-plans", json={
        "week_start_date": "2026-04-21",
        "name": "Week 1",
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Week 1"


async def test_list_meal_plans(auth_client):
    await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "Week 1"})
    response = await auth_client.get("/meal-plans")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_add_entry_to_plan(auth_client):
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    response = await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0,
        "meal_type": "breakfast",
        "custom_meal_name": "Eggs",
        "servings": 1,
    })
    assert response.status_code == 201
    assert response.json()["meal_type"] == "breakfast"


async def test_get_plan_with_entries(auth_client):
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 1, "meal_type": "lunch", "custom_meal_name": "Salad", "servings": 1,
    })
    response = await auth_client.get(f"/meal-plans/{plan['id']}")
    assert response.status_code == 200
    assert len(response.json()["entries"]) == 1


async def test_delete_entry(auth_client):
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    entry = (await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 2, "meal_type": "dinner", "custom_meal_name": "Fish", "servings": 1,
    })).json()
    response = await auth_client.delete(f"/meal-plans/{plan['id']}/entries/{entry['id']}")
    assert response.status_code == 204
```

- [ ] **Step 3: Run tests**

```bash
cd backend
pytest tests/test_meal_plans.py -v
```

Expected: all 5 tests PASS

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/meal_plans.py backend/tests/test_meal_plans.py
git commit -m "feat: meal plans CRUD router with tests"
```

---

## Task 11: Shopping List Service + Router + Tests

**Files:**
- Create: `backend/app/services/shopping.py`
- Modify: `backend/app/routers/shopping_lists.py`
- Create: `backend/tests/test_shopping_lists.py`

- [ ] **Step 1: Create backend/app/services/shopping.py**

```python
# backend/app/services/shopping.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.meal_plan import MealPlan, MealPlanEntry
from app.models.recipe import Recipe
from app.models.shopping_list import ShoppingList, ShoppingListItem

CATEGORY_KEYWORDS = {
    "produce": ["tomato", "lettuce", "spinach", "carrot", "onion", "garlic", "pepper", "broccoli", "apple", "banana", "lemon"],
    "dairy": ["milk", "cheese", "yogurt", "butter", "cream", "egg"],
    "meat": ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "shrimp"],
    "grains": ["rice", "pasta", "bread", "oat", "flour", "quinoa", "barley"],
}


def _categorize(name: str) -> str:
    lower = name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return category
    return "other"


async def generate_shopping_list(
    plan_id: int,
    user_id: int,
    db: AsyncSession,
) -> ShoppingList:
    result = await db.execute(
        select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == user_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        return None

    entries_result = await db.execute(
        select(MealPlanEntry).where(MealPlanEntry.meal_plan_id == plan_id)
    )
    entries = entries_result.scalars().all()

    # Aggregate ingredients from recipes
    aggregated: dict[str, dict] = {}
    for entry in entries:
        if not entry.recipe_id:
            continue
        recipe_result = await db.execute(select(Recipe).where(Recipe.id == entry.recipe_id))
        recipe = recipe_result.scalar_one_or_none()
        if not recipe:
            continue
        for ingredient in recipe.ingredients:
            name = ingredient.get("name", "").strip().lower()
            if not name:
                continue
            qty = (ingredient.get("quantity") or 0) * entry.servings
            unit = ingredient.get("unit", "")
            key = f"{name}|{unit}"
            if key in aggregated:
                aggregated[key]["quantity"] = (aggregated[key]["quantity"] or 0) + qty
            else:
                aggregated[key] = {"name": ingredient["name"], "quantity": qty or None, "unit": unit or None}

    shopping_list = ShoppingList(user_id=user_id, meal_plan_id=plan_id)
    db.add(shopping_list)
    await db.flush()

    for data in aggregated.values():
        item = ShoppingListItem(
            shopping_list_id=shopping_list.id,
            ingredient_name=data["name"],
            quantity=data["quantity"],
            unit=data["unit"],
            category=_categorize(data["name"]),
        )
        db.add(item)

    await db.commit()
    await db.refresh(shopping_list)
    return shopping_list
```

- [ ] **Step 2: Replace stub with full shopping lists router**

```python
# backend/app/routers/shopping_lists.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.shopping_list import ShoppingList, ShoppingListItem
from app.models.user import User
from app.schemas.shopping_list import ShoppingListItemCreate, ShoppingListItemOut, ShoppingListItemUpdate, ShoppingListOut
from app.services.shopping import generate_shopping_list

router = APIRouter()


# This endpoint is mounted under /meal-plans in main.py, so we handle the prefix here
# But since we're using /shopping-lists prefix, we need a separate generate endpoint
# accessed via: POST /meal-plans/{plan_id}/shopping-list
# We handle this via a router mounted on the meal_plans router in main.py

@router.get("/{list_id}", response_model=ShoppingListOut)
async def get_shopping_list(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id))
    shopping_list = result.scalar_one_or_none()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    items_result = await db.execute(select(ShoppingListItem).where(ShoppingListItem.shopping_list_id == list_id))
    items = items_result.scalars().all()
    return ShoppingListOut.model_validate({**shopping_list.__dict__, "items": items})


@router.post("/{list_id}/items", response_model=ShoppingListItemOut, status_code=201)
async def add_item(
    list_id: int,
    body: ShoppingListItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Shopping list not found")
    item = ShoppingListItem(shopping_list_id=list_id, **body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/{list_id}/items/{item_id}", response_model=ShoppingListItemOut)
async def update_item(
    list_id: int,
    item_id: int,
    body: ShoppingListItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingListItem).join(ShoppingList).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{list_id}/items/{item_id}", status_code=204)
async def delete_item(
    list_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingListItem).join(ShoppingList).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
```

- [ ] **Step 3: Add generate endpoint to meal_plans router**

Add this to `backend/app/routers/meal_plans.py` at the end:

```python
# Add this import at the top of meal_plans.py:
from app.services.shopping import generate_shopping_list
from app.schemas.shopping_list import ShoppingListOut

# Add this endpoint:
@router.post("/{plan_id}/shopping-list", response_model=ShoppingListOut, status_code=201)
async def create_shopping_list(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shopping_list = await generate_shopping_list(plan_id, current_user.id, db)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    from sqlalchemy import select as sa_select
    from app.models.shopping_list import ShoppingListItem
    items_result = await db.execute(sa_select(ShoppingListItem).where(ShoppingListItem.shopping_list_id == shopping_list.id))
    items = items_result.scalars().all()
    return ShoppingListOut.model_validate({**shopping_list.__dict__, "items": items})
```

- [ ] **Step 4: Write shopping list tests**

```python
# backend/tests/test_shopping_lists.py
import pytest


async def test_generate_shopping_list(auth_client):
    recipe = (await auth_client.post("/recipes", json={
        "name": "Pasta",
        "calories": 500,
        "servings": 1,
        "ingredients": [
            {"name": "Pasta", "quantity": 200, "unit": "g"},
            {"name": "Tomato Sauce", "quantity": 100, "unit": "ml"},
        ],
    })).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0, "meal_type": "dinner", "recipe_id": recipe["id"], "servings": 1,
    })
    response = await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")
    assert response.status_code == 201
    items = response.json()["items"]
    names = [i["ingredient_name"] for i in items]
    assert "Pasta" in names


async def test_check_item(auth_client):
    recipe = (await auth_client.post("/recipes", json={
        "name": "Eggs", "calories": 200, "servings": 1,
        "ingredients": [{"name": "Eggs", "quantity": 2, "unit": "pcs"}],
    })).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0, "meal_type": "breakfast", "recipe_id": recipe["id"], "servings": 1,
    })
    sl = (await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")).json()
    item_id = sl["items"][0]["id"]
    response = await auth_client.patch(f"/shopping-lists/{sl['id']}/items/{item_id}", json={"is_checked": True})
    assert response.status_code == 200
    assert response.json()["is_checked"] is True


async def test_add_manual_item(auth_client):
    recipe = (await auth_client.post("/recipes", json={"name": "X", "calories": 100, "servings": 1, "ingredients": [{"name": "X"}]})).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={"day_of_week": 0, "meal_type": "lunch", "recipe_id": recipe["id"], "servings": 1})
    sl = (await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")).json()
    response = await auth_client.post(f"/shopping-lists/{sl['id']}/items", json={
        "ingredient_name": "Olive Oil", "quantity": 1, "unit": "bottle", "category": "other",
    })
    assert response.status_code == 201
    assert response.json()["ingredient_name"] == "Olive Oil"
```

- [ ] **Step 5: Run tests**

```bash
cd backend
pytest tests/test_shopping_lists.py -v
```

Expected: all 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/shopping.py backend/app/routers/shopping_lists.py backend/app/routers/meal_plans.py backend/tests/test_shopping_lists.py
git commit -m "feat: shopping list generation service and router with tests"
```

---

## Task 12: Progress Router + Tests

**Files:**
- Modify: `backend/app/routers/progress.py`
- Create: `backend/tests/test_progress.py`

- [ ] **Step 1: Replace stub with full progress router**

```python
# backend/app/routers/progress.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.progress import ProgressLog
from app.models.user import User
from app.schemas.progress import ProgressLogCreate, ProgressLogOut

router = APIRouter()


@router.get("", response_model=list[ProgressLogOut])
async def list_progress(
    from_date: date | None = None,
    to_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ProgressLog).where(ProgressLog.user_id == current_user.id).order_by(ProgressLog.logged_at)
    if from_date:
        q = q.where(ProgressLog.logged_at >= from_date)
    if to_date:
        q = q.where(ProgressLog.logged_at <= to_date)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ProgressLogOut, status_code=201)
async def log_progress(
    body: ProgressLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = ProgressLog(user_id=current_user.id, **body.model_dump())
    db.add(log)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already logged for this date")
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=204)
async def delete_progress(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ProgressLog).where(ProgressLog.id == log_id, ProgressLog.user_id == current_user.id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    await db.delete(log)
    await db.commit()
```

- [ ] **Step 2: Write progress tests**

```python
# backend/tests/test_progress.py
import pytest
from datetime import date


async def test_log_progress(auth_client):
    response = await auth_client.post("/progress", json={
        "logged_at": "2026-04-21",
        "weight_kg": 75.5,
        "body_fat_pct": 18.2,
        "notes": "Feeling good",
    })
    assert response.status_code == 201
    assert response.json()["weight_kg"] == 75.5


async def test_list_progress(auth_client):
    await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 75.0})
    await auth_client.post("/progress", json={"logged_at": "2026-04-22", "weight_kg": 74.8})
    response = await auth_client.get("/progress")
    assert response.status_code == 200
    assert len(response.json()) == 2


async def test_duplicate_date_rejected(auth_client):
    await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 75.0})
    response = await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 74.0})
    assert response.status_code == 409


async def test_delete_progress(auth_client):
    log = (await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 75.0})).json()
    response = await auth_client.delete(f"/progress/{log['id']}")
    assert response.status_code == 204
```

- [ ] **Step 3: Run tests**

```bash
cd backend
pytest tests/test_progress.py -v
```

Expected: all 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/progress.py backend/tests/test_progress.py
git commit -m "feat: progress logging router with tests"
```

---

## Task 13: Ollama AI Client + SSE Router + Tests

**Files:**
- Create: `backend/app/ai/client.py`
- Create: `backend/app/ai/prompts.py`
- Modify: `backend/app/routers/ai.py`
- Create: `backend/tests/test_ai.py`

- [ ] **Step 1: Create backend/app/ai/prompts.py**

```python
# backend/app/ai/prompts.py
from app.models.user import User


def build_system_prompt(user: User) -> str:
    return f"""You are a helpful diet and nutrition assistant. 
The user's profile:
- Goal: {user.goal} weight
- Daily calorie target: {user.daily_calorie_target} kcal
- Activity level: {user.activity_level}

Suggest practical, healthy meals that fit their calorie target.
Keep suggestions concise: meal name, rough calories, key ingredients, and brief preparation notes.
When asked for a full day, provide breakfast, lunch, dinner, and a snack."""


def build_system_prompt_with_restrictions(user: User, restrictions: list[str]) -> str:
    base = build_system_prompt(user)
    if restrictions:
        base += f"\nDietary restrictions: {', '.join(restrictions)}. Do not suggest foods that violate these."
    return base
```

- [ ] **Step 2: Create backend/app/ai/client.py**

```python
# backend/app/ai/client.py
from collections.abc import AsyncGenerator
import httpx
from app.core.config import settings


async def stream_ollama(system_prompt: str, user_message: str) -> AsyncGenerator[str, None]:
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", f"{settings.ollama_host}/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                import json
                try:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue
```

- [ ] **Step 3: Replace stub with full AI router**

```python
# backend/app/routers/ai.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AISuggestRequest
from app.ai.client import stream_ollama
from app.ai.prompts import build_system_prompt_with_restrictions

router = APIRouter()


@router.post("/suggest")
async def suggest(
    body: AISuggestRequest,
    current_user: User = Depends(get_current_user),
):
    system_prompt = build_system_prompt_with_restrictions(current_user, body.context.restrictions)

    async def event_stream():
        try:
            async for token in stream_ollama(system_prompt, body.message):
                yield f"data: {token}\n\n"
        except Exception as e:
            yield f"data: [Error: {str(e)}]\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

- [ ] **Step 4: Write AI tests (mock Ollama)**

```python
# backend/tests/test_ai.py
import pytest
from unittest.mock import AsyncMock, patch


async def test_suggest_returns_stream(auth_client):
    async def mock_stream(system_prompt, message):
        for token in ["Here ", "is ", "a ", "suggestion"]:
            yield token

    with patch("app.routers.ai.stream_ollama", side_effect=mock_stream):
        response = await auth_client.post("/ai/suggest", json={
            "message": "Suggest breakfast",
            "context": {
                "goal": "maintain",
                "daily_calorie_target": 2000,
                "restrictions": [],
            },
        })
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


async def test_suggest_requires_auth(client):
    response = await client.post("/ai/suggest", json={
        "message": "Suggest something",
        "context": {"goal": "maintain", "daily_calorie_target": 2000, "restrictions": []},
    })
    assert response.status_code == 401
```

- [ ] **Step 5: Run tests**

```bash
cd backend
pytest tests/test_ai.py -v
```

Expected: all 2 tests PASS

- [ ] **Step 6: Run full test suite**

```bash
cd backend
pytest -v
```

Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/ai/ backend/app/routers/ai.py backend/tests/test_ai.py
git commit -m "feat: Ollama AI streaming endpoint with tests"
```

---

## Task 14: Wire Up Docker Compose + Smoke Test

**Files:**
- Modify: `backend/app/main.py` (add startup event for DB migration)
- Create: `backend/start.sh`

- [ ] **Step 1: Update main.py with lifespan for DB init**

```python
# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import Base
from app.routers import auth, recipes, meal_plans, shopping_lists, progress, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (for dev; use Alembic for prod)
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    yield


app = FastAPI(title="Diet Planner API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
app.include_router(meal_plans.router, prefix="/meal-plans", tags=["meal-plans"])
app.include_router(shopping_lists.router, prefix="/shopping-lists", tags=["shopping-lists"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 2: Create backend/start.sh**

```bash
#!/bin/sh
# backend/start.sh
set -e
echo "Running Alembic migrations..."
alembic upgrade head
echo "Starting FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- [ ] **Step 3: Update backend/Dockerfile to use start.sh**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x start.sh

CMD ["./start.sh"]
```

- [ ] **Step 4: Build and start with Docker Compose**

```bash
cd "C:/Users/moham/Documents/Diet Planner"
cp .env.example .env
# Edit .env and set a real JWT_SECRET value
docker compose up --build -d db backend ollama
```

- [ ] **Step 5: Smoke test the running API**

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test User"}'
```

Expected: 201 with user JSON

- [ ] **Step 6: Commit**

```bash
git add backend/app/main.py backend/start.sh backend/Dockerfile
git commit -m "feat: Docker Compose startup with Alembic migration on boot"
```

---

## Self-Review Notes

- All 6 spec features have router coverage: auth, recipes, meal plans, shopping lists, progress, AI
- Nutrition calculation (Mifflin-St Jeor) implemented in `services/nutrition.py` and wired into register + profile update
- Shopping list aggregation correctly multiplies by `servings`
- AI endpoint requires auth (covered in test)
- Duplicate progress date returns 409 (covered in test)
- Public recipe visibility scoped correctly in recipes list query
- `[DONE]` SSE sentinel allows frontend to detect stream end
