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
    if any(v is None for v in [weight_kg, height_cm, age, gender]):
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
