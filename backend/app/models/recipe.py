# backend/app/models/recipe.py
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    prep_time_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int] = mapped_column(Integer, server_default="1")
    calories: Mapped[float] = mapped_column(Float, server_default="0")
    protein_g: Mapped[float] = mapped_column(Float, server_default="0")
    carbs_g: Mapped[float] = mapped_column(Float, server_default="0")
    fat_g: Mapped[float] = mapped_column(Float, server_default="0")
    ingredients: Mapped[list[dict]] = mapped_column(JSON, default=list)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
