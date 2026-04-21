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
