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
