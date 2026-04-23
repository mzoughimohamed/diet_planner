from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import create_access_token, get_current_user, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserLogin, UserOut, UserRegister, UserUpdate
from app.services.nutrition import calculate_daily_calories

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    calories = calculate_daily_calories(
        body.weight_kg, body.height_cm, body.age, body.gender, body.activity_level, body.goal
    )
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        age=body.age,
        gender=body.gender,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        goal=body.goal,
        activity_level=body.activity_level,
        daily_calorie_target=calories,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id)
    response.set_cookie("access_token", token, httponly=True, samesite="strict", max_age=60 * 60 * 24 * 7)
    return user


@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    response.set_cookie("access_token", token, httponly=True, samesite="strict", max_age=60 * 60 * 24 * 7)
    return user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    if any(f in body.model_dump(exclude_none=True) for f in ["weight_kg", "height_cm", "age", "gender", "activity_level", "goal"]):
        current_user.daily_calorie_target = calculate_daily_calories(
            current_user.weight_kg, current_user.height_cm, current_user.age,
            current_user.gender, current_user.activity_level, current_user.goal,
        )
    await db.commit()
    await db.refresh(current_user)
    return current_user
