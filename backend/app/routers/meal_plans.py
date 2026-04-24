from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.meal_plan import MealPlan, MealPlanEntry
from app.models.recipe import Recipe
from app.models.user import User
from app.services.push_service import send_push_to_user
from app.schemas.meal_plan import (
    MealPlanCreate, MealPlanDetail, MealPlanEntryCreate,
    MealPlanEntryOut, MealPlanEntryUpdate, MealPlanOut,
)
from app.services.shopping import generate_shopping_list
from app.schemas.shopping_list import ShoppingListOut
from app.models.shopping_list import ShoppingListItem

router = APIRouter()


@router.get("", response_model=list[MealPlanOut])
async def list_meal_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MealPlan).where(MealPlan.user_id == current_user.id))
    return result.scalars().all()


@router.post("", response_model=MealPlanOut, status_code=201)
async def create_meal_plan(
    body: MealPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = MealPlan(user_id=current_user.id, **body.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=MealPlanDetail)
async def get_meal_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    entries_result = await db.execute(select(MealPlanEntry).where(MealPlanEntry.meal_plan_id == plan_id))
    entries = entries_result.scalars().all()
    return MealPlanDetail.model_validate({**plan.__dict__, "entries": entries})


@router.post("/{plan_id}/entries", response_model=MealPlanEntryOut, status_code=201)
async def add_entry(
    plan_id: int,
    body: MealPlanEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meal plan not found")
    entry = MealPlanEntry(meal_plan_id=plan_id, **body.model_dump(mode="json"))
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Fire calorie alert if today's planned calories cross 80% of target
    today_dow = date.today().weekday()  # 0=Mon, matches day_of_week field
    if body.day_of_week == today_dow:
        entries_result = await db.execute(
            select(MealPlanEntry).where(
                MealPlanEntry.meal_plan_id == plan_id,
                MealPlanEntry.day_of_week == today_dow,
            )
        )
        today_entries = entries_result.scalars().all()
        total: float = 0.0
        for e in today_entries:
            if e.calories_override is not None:
                total += e.calories_override
            elif e.recipe_id is not None:
                r_res = await db.execute(select(Recipe).where(Recipe.id == e.recipe_id))
                recipe = r_res.scalar_one_or_none()
                if recipe:
                    total += recipe.calories * e.servings
        target = current_user.daily_calorie_target
        if total >= target * 0.8:
            await send_push_to_user(
                current_user.id,
                "Calorie Goal Alert 🎯",
                f"You're at {int(total)} kcal — {int(target - total)} kcal left today!",
                db,
            )

    return entry


@router.put("/{plan_id}/entries/{entry_id}", response_model=MealPlanEntryOut)
async def update_entry(
    plan_id: int,
    entry_id: int,
    body: MealPlanEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MealPlanEntry).join(MealPlan).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan_id,
            MealPlan.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in body.model_dump(exclude_none=True, mode="json").items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{plan_id}/entries/{entry_id}", status_code=204)
async def delete_entry(
    plan_id: int,
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MealPlanEntry).join(MealPlan).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan_id,
            MealPlan.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()


@router.post("/{plan_id}/shopping-list", response_model=ShoppingListOut, status_code=201)
async def create_shopping_list(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shopping_list = await generate_shopping_list(plan_id, current_user.id, db)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    items_result = await db.execute(select(ShoppingListItem).where(ShoppingListItem.shopping_list_id == shopping_list.id))
    items = items_result.scalars().all()
    return ShoppingListOut.model_validate({**shopping_list.__dict__, "items": items})
