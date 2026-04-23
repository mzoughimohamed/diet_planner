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
