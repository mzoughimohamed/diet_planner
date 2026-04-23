# backend/app/schemas/recipe.py
from datetime import datetime
from pydantic import BaseModel, Field


class IngredientItem(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None


class RecipeCreate(BaseModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    prep_time_min: int | None = None
    servings: int = Field(default=1, ge=1)
    calories: float = Field(default=0, ge=0)
    protein_g: float = Field(default=0, ge=0)
    carbs_g: float = Field(default=0, ge=0)
    fat_g: float = Field(default=0, ge=0)
    ingredients: list[IngredientItem] = []
    instructions: str | None = None
    is_public: bool = False


class RecipeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    prep_time_min: int | None = None
    servings: int | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    ingredients: list[IngredientItem] | None = None
    instructions: str | None = None
    is_public: bool | None = None


class RecipeOut(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    image_url: str | None
    prep_time_min: int | None
    servings: int
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    ingredients: list[IngredientItem]
    instructions: str | None
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}
