from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeOut, RecipeUpdate

router = APIRouter()


@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    search: str | None = None,
    max_calories: float | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Recipe).where(
        or_(Recipe.user_id == current_user.id, Recipe.is_public == True)  # noqa: E712
    )
    if search:
        q = q.where(Recipe.name.ilike(f"%{search}%"))
    if max_calories is not None:
        q = q.where(Recipe.calories <= max_calories)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.user_id != current_user.id and not recipe.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    return recipe


@router.post("", response_model=RecipeOut, status_code=201)
async def create_recipe(
    body: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = Recipe(
        user_id=current_user.id,
        **body.model_dump(mode="json"),
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.put("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: int,
    body: RecipeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    for field, value in body.model_dump(exclude_none=True, mode="json").items():
        setattr(recipe, field, value)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    await db.delete(recipe)
    await db.commit()
