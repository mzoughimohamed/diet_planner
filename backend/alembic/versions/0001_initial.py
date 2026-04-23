# backend/alembic/versions/0001_initial.py
"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String, unique=True, nullable=False),
        sa.Column("hashed_password", sa.String, nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("avatar_url", sa.String, nullable=True),
        sa.Column("age", sa.Integer, nullable=True),
        sa.Column("gender", sa.String(10), nullable=True),
        sa.Column("height_cm", sa.Float, nullable=True),
        sa.Column("weight_kg", sa.Float, nullable=True),
        sa.Column("goal", sa.String(20), server_default="maintain"),
        sa.Column("activity_level", sa.String(20), server_default="moderate"),
        sa.Column("daily_calorie_target", sa.Integer, server_default="2000"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("image_url", sa.String, nullable=True),
        sa.Column("prep_time_min", sa.Integer, nullable=True),
        sa.Column("servings", sa.Integer, server_default="1"),
        sa.Column("calories", sa.Float, server_default="0"),
        sa.Column("protein_g", sa.Float, server_default="0"),
        sa.Column("carbs_g", sa.Float, server_default="0"),
        sa.Column("fat_g", sa.Float, server_default="0"),
        sa.Column("ingredients", sa.JSON, server_default="[]"),
        sa.Column("instructions", sa.Text, nullable=True),
        sa.Column("is_public", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "meal_plans",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_start_date", sa.Date, nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "meal_plan_entries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("meal_plan_id", sa.Integer, sa.ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("meal_type", sa.String(20), nullable=False),
        sa.Column("recipe_id", sa.Integer, sa.ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("custom_meal_name", sa.String, nullable=True),
        sa.Column("servings", sa.Float, server_default="1"),
        sa.Column("calories_override", sa.Float, nullable=True),
    )
    op.create_table(
        "shopping_lists",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("meal_plan_id", sa.Integer, sa.ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "shopping_list_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("shopping_list_id", sa.Integer, sa.ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ingredient_name", sa.String, nullable=False),
        sa.Column("quantity", sa.Float, nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("category", sa.String(50), server_default="other"),
        sa.Column("is_checked", sa.Boolean, server_default="false"),
    )
    op.create_table(
        "progress_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("logged_at", sa.Date, nullable=False),
        sa.Column("weight_kg", sa.Float, nullable=True),
        sa.Column("body_fat_pct", sa.Float, nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.UniqueConstraint("user_id", "logged_at", name="uq_user_date"),
    )


def downgrade() -> None:
    op.drop_table("progress_logs")
    op.drop_table("shopping_list_items")
    op.drop_table("shopping_lists")
    op.drop_table("meal_plan_entries")
    op.drop_table("meal_plans")
    op.drop_table("recipes")
    op.drop_index("ix_users_email", "users")
    op.drop_table("users")
