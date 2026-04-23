# backend/app/schemas/ai.py
from pydantic import BaseModel


class AIContext(BaseModel):
    goal: str
    daily_calorie_target: int
    restrictions: list[str] = []


class AISuggestRequest(BaseModel):
    message: str
    context: AIContext
