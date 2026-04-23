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
