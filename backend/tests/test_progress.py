# backend/tests/test_progress.py
import pytest


async def test_log_progress(auth_client):
    response = await auth_client.post("/progress", json={
        "logged_at": "2026-04-21",
        "weight_kg": 75.5,
        "body_fat_pct": 18.2,
        "notes": "Feeling good",
    })
    assert response.status_code == 201
    assert response.json()["weight_kg"] == 75.5


async def test_list_progress(auth_client):
    await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 75.0})
    await auth_client.post("/progress", json={"logged_at": "2026-04-22", "weight_kg": 74.8})
    response = await auth_client.get("/progress")
    assert response.status_code == 200
    assert len(response.json()) == 2


async def test_duplicate_date_rejected(auth_client):
    await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 75.0})
    response = await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 74.0})
    assert response.status_code == 409


async def test_delete_progress(auth_client):
    log = (await auth_client.post("/progress", json={"logged_at": "2026-04-21", "weight_kg": 75.0})).json()
    response = await auth_client.delete(f"/progress/{log['id']}")
    assert response.status_code == 204
