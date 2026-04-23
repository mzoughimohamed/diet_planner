# backend/tests/test_ai.py
from unittest.mock import patch


async def test_suggest_returns_stream(auth_client):
    async def mock_stream(system_prompt, message):
        for token in ["Here ", "is ", "a ", "suggestion"]:
            yield token

    with patch("app.routers.ai.stream_ollama", side_effect=mock_stream):
        response = await auth_client.post("/ai/suggest", json={
            "message": "Suggest breakfast",
            "context": {
                "goal": "maintain",
                "daily_calorie_target": 2000,
                "restrictions": [],
            },
        })
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


async def test_suggest_requires_auth(client):
    response = await client.post("/ai/suggest", json={
        "message": "Suggest something",
        "context": {"goal": "maintain", "daily_calorie_target": 2000, "restrictions": []},
    })
    assert response.status_code == 401
