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
