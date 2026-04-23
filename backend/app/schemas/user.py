# backend/app/schemas/user.py
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    goal: Literal["lose", "maintain", "gain"] = "maintain"
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"] = "moderate"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    goal: Literal["lose", "maintain", "gain"] | None = None
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"] | None = None
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
