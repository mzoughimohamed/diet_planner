# backend/app/schemas/__init__.py
from app.schemas.user import UserRegister, UserLogin, UserUpdate, UserOut
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeOut, IngredientItem
from app.schemas.meal_plan import MealPlanCreate, MealPlanOut, MealPlanEntryCreate, MealPlanEntryUpdate, MealPlanEntryOut, MealPlanDetail
from app.schemas.shopping_list import ShoppingListOut, ShoppingListItemCreate, ShoppingListItemUpdate, ShoppingListItemOut
from app.schemas.progress import ProgressLogCreate, ProgressLogOut
from app.schemas.ai import AISuggestRequest, AIContext
