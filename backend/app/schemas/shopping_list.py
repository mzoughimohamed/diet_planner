# backend/app/schemas/shopping_list.py
from datetime import datetime
from pydantic import BaseModel


class ShoppingListItemCreate(BaseModel):
    ingredient_name: str
    quantity: float | None = None
    unit: str | None = None
    category: str = "other"


class ShoppingListItemUpdate(BaseModel):
    is_checked: bool | None = None
    quantity: float | None = None
    unit: str | None = None


class ShoppingListItemOut(BaseModel):
    id: int
    shopping_list_id: int
    ingredient_name: str
    quantity: float | None
    unit: str | None
    category: str
    is_checked: bool

    model_config = {"from_attributes": True}


class ShoppingListOut(BaseModel):
    id: int
    user_id: int
    meal_plan_id: int
    generated_at: datetime
    items: list[ShoppingListItemOut] = []

    model_config = {"from_attributes": True}
