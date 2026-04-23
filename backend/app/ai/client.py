# backend/app/ai/client.py
import json
from collections.abc import AsyncGenerator
import httpx
from app.core.config import settings


async def stream_ollama(system_prompt: str, user_message: str) -> AsyncGenerator[str, None]:
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", f"{settings.ollama_host}/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue
