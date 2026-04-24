import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_subscribe_creates_subscription(auth_client: AsyncClient):
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
        "keys": {"p256dh": "test-p256dh-key", "auth": "test-auth-key"},
    }
    resp = await auth_client.post("/push/subscribe", json=payload)
    assert resp.status_code == 201
    assert resp.json() == {"status": "subscribed"}


@pytest.mark.asyncio
async def test_subscribe_upserts_on_same_user(auth_client: AsyncClient):
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/endpoint-a",
        "keys": {"p256dh": "key-a", "auth": "auth-a"},
    }
    await auth_client.post("/push/subscribe", json=payload)

    payload2 = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/endpoint-b",
        "keys": {"p256dh": "key-b", "auth": "auth-b"},
    }
    resp = await auth_client.post("/push/subscribe", json=payload2)
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_unsubscribe(auth_client: AsyncClient):
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/test-del",
        "keys": {"p256dh": "key", "auth": "auth"},
    }
    await auth_client.post("/push/subscribe", json=payload)
    resp = await auth_client.delete("/push/subscribe")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_subscribe_requires_auth(client: AsyncClient):
    resp = await client.post("/push/subscribe", json={
        "endpoint": "x", "keys": {"p256dh": "x", "auth": "x"}
    })
    assert resp.status_code == 401
