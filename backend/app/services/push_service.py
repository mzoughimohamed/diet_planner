import asyncio
import base64
import json
from concurrent.futures import ThreadPoolExecutor

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.push_subscription import PushSubscription

_executor = ThreadPoolExecutor(max_workers=4)


def _private_key_pem() -> str:
    """Convert base64url raw scalar stored in settings to PEM string."""
    padding = "=" * (4 - len(settings.vapid_private_key) % 4)
    raw = base64.urlsafe_b64decode(settings.vapid_private_key + padding)
    key = ec.derive_private_key(int.from_bytes(raw, "big"), ec.SECP256R1())
    return key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption(),
    ).decode()


def _send_sync(subscription_info: dict, title: str, body: str) -> None:
    if not settings.vapid_private_key:
        return
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body}),
            vapid_private_key=_private_key_pem(),
            vapid_claims={"sub": settings.vapid_claims_sub},
        )
    except WebPushException:
        pass


async def send_push_to_user(
    user_id: int, title: str, body: str, db: AsyncSession
) -> None:
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subs = result.scalars().all()
    loop = asyncio.get_event_loop()
    for sub in subs:
        info = {"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}}
        await loop.run_in_executor(_executor, _send_sync, info, title, body)


async def send_push_to_all(title: str, body: str) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(PushSubscription))
        subs = result.scalars().all()
        loop = asyncio.get_event_loop()
        for sub in subs:
            info = {"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}}
            await loop.run_in_executor(_executor, _send_sync, info, title, body)
