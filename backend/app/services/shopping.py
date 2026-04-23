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
) -> ShoppingList | None:
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
