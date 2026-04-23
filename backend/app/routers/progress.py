from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.progress import ProgressLog
from app.models.user import User
from app.schemas.progress import ProgressLogCreate, ProgressLogOut

router = APIRouter()


@router.get("", response_model=list[ProgressLogOut])
async def list_progress(
    from_date: date | None = None,
    to_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ProgressLog).where(ProgressLog.user_id == current_user.id).order_by(ProgressLog.logged_at)
    if from_date:
        q = q.where(ProgressLog.logged_at >= from_date)
    if to_date:
        q = q.where(ProgressLog.logged_at <= to_date)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ProgressLogOut, status_code=201)
async def log_progress(
    body: ProgressLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = ProgressLog(user_id=current_user.id, **body.model_dump())
    db.add(log)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already logged for this date")
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=204)
async def delete_progress(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ProgressLog).where(ProgressLog.id == log_id, ProgressLog.user_id == current_user.id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    await db.commit()
