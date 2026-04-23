# backend/tests/conftest.py
import os
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_diet.db")
os.environ.setdefault("JWT_SECRET", "test-secret-for-tests-only")

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_diet.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def auth_client(client):
    """Returns a client already logged in as a test user."""
    await client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "weight_kg": 75,
        "height_cm": 175,
        "age": 30,
        "gender": "male",
        "goal": "maintain",
        "activity_level": "moderate",
    })
    return client
