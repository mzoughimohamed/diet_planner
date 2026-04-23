# backend/app/routers/ai.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AISuggestRequest
from app.ai.client import stream_ollama
from app.ai.prompts import build_system_prompt_with_restrictions

router = APIRouter()


@router.post("/suggest")
async def suggest(
    body: AISuggestRequest,
    current_user: User = Depends(get_current_user),
):
    system_prompt = build_system_prompt_with_restrictions(current_user, body.context.restrictions)

    async def event_stream():
        try:
            async for token in stream_ollama(system_prompt, body.message):
                yield f"data: {token}\n\n"
        except Exception as e:
            yield f"data: [Error: {str(e)}]\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
