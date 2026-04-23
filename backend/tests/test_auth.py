# backend/tests/test_auth.py
import pytest


async def test_register_success(client):
    response = await client.post("/auth/register", json={
        "email": "user@example.com",
        "password": "secret123",
        "name": "Alice",
        "weight_kg": 65,
        "height_cm": 165,
        "age": 28,
        "gender": "female",
        "goal": "lose",
        "activity_level": "light",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user@example.com"
    assert data["name"] == "Alice"
    assert data["daily_calorie_target"] > 0
    assert "access_token" in response.cookies


async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass1234", "name": "Bob"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 400


async def test_login_success(client):
    await client.post("/auth/register", json={"email": "login@example.com", "password": "pass1234", "name": "Carol"})
    response = await client.post("/auth/login", json={"email": "login@example.com", "password": "pass1234"})
    assert response.status_code == 200
    assert "access_token" in response.cookies


async def test_login_wrong_password(client):
    await client.post("/auth/register", json={"email": "pw@example.com", "password": "rightpass", "name": "Dave"})
    response = await client.post("/auth/login", json={"email": "pw@example.com", "password": "wrongpass"})
    assert response.status_code == 401


async def test_me_authenticated(auth_client):
    response = await auth_client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


async def test_me_unauthenticated(client):
    response = await client.get("/auth/me")
    assert response.status_code == 401
