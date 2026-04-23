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
