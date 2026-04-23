# backend/app/routers/shopping_lists.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.shopping_list import ShoppingList, ShoppingListItem
from app.models.user import User
from app.schemas.shopping_list import ShoppingListItemCreate, ShoppingListItemOut, ShoppingListItemUpdate, ShoppingListOut

router = APIRouter()


@router.get("", response_model=list[ShoppingListOut])
async def list_shopping_lists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ShoppingList).where(ShoppingList.user_id == current_user.id))
    shopping_lists = result.scalars().all()
    output = []
    for sl in shopping_lists:
        items_result = await db.execute(select(ShoppingListItem).where(ShoppingListItem.shopping_list_id == sl.id))
        items = items_result.scalars().all()
        output.append(ShoppingListOut.model_validate({**sl.__dict__, "items": items}))
    return output


@router.get("/{list_id}", response_model=ShoppingListOut)
async def get_shopping_list(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id))
    shopping_list = result.scalar_one_or_none()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    items_result = await db.execute(select(ShoppingListItem).where(ShoppingListItem.shopping_list_id == list_id))
    items = items_result.scalars().all()
    return ShoppingListOut.model_validate({**shopping_list.__dict__, "items": items})


@router.post("/{list_id}/items", response_model=ShoppingListItemOut, status_code=201)
async def add_item(
    list_id: int,
    body: ShoppingListItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Shopping list not found")
    item = ShoppingListItem(shopping_list_id=list_id, **body.model_dump(mode="json"))
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/{list_id}/items/{item_id}", response_model=ShoppingListItemOut)
async def update_item(
    list_id: int,
    item_id: int,
    body: ShoppingListItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingListItem).join(ShoppingList).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in body.model_dump(exclude_none=True, mode="json").items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{list_id}/items/{item_id}", status_code=204)
async def delete_item(
    list_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingListItem).join(ShoppingList).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
