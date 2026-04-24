from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.push_subscription import PushSubscription
from app.models.user import User

router = APIRouter()


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class SubscribePayload(BaseModel):
    endpoint: str
    keys: PushKeys


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe(
    payload: SubscribePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
    )
    db.add(sub)
    await db.commit()
    return {"status": "subscribed"}


@router.delete("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    await db.commit()
