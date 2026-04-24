# PWA Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Diet Planner web app into a full-offline-capable installable PWA with background sync for mutations and Web Push notifications for meal reminders and calorie goal alerts.

**Architecture:** A PWA layer is added on top of the existing React + FastAPI stack without touching existing pages or API routes (except `AISuggestions.tsx` offline guard and `add_entry` for calorie alerts). The frontend gets Workbox caching + TanStack Query cache persistence to IndexedDB for offline reads, and a Background Sync queue for offline writes. The backend gains a `push_subscriptions` table, a push router, and an APScheduler for daily meal reminders.

**Tech Stack:** `vite-plugin-pwa`, Workbox (precaching/routing/strategies/background-sync), `@tanstack/react-query-persist-client`, `idb-keyval`, `pywebpush`, `apscheduler`, `sharp` (icon generation devDep).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/generate_vapid_keys.py` | Create | One-time VAPID key pair generator script |
| `backend/app/core/config.py` | Modify | Add `vapid_private_key`, `vapid_public_key`, `vapid_claims_sub` settings |
| `backend/app/models/push_subscription.py` | Create | `PushSubscription` SQLAlchemy model |
| `backend/app/models/__init__.py` | Modify | Export `PushSubscription` so `create_all` picks it up |
| `backend/app/services/push_service.py` | Create | `send_push_to_user()` and `send_push_to_all()` using pywebpush |
| `backend/app/routers/push.py` | Create | `POST /push/subscribe`, `DELETE /push/subscribe` |
| `backend/app/services/scheduler.py` | Create | APScheduler with 4 daily reminder jobs |
| `backend/app/routers/meal_plans.py` | Modify | Calorie alert after `add_entry` commit |
| `backend/app/main.py` | Modify | Register push router, start/stop scheduler in lifespan |
| `backend/requirements.txt` | Modify | Add `pywebpush`, `apscheduler` |
| `backend/tests/test_push.py` | Create | Integration tests for push router |
| `.env` (root) | Modify | Add `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIMS_SUB` |
| `.env.example` | Modify | Document new VAPID vars |
| `frontend/package.json` | Modify | Add PWA + workbox + persister + sharp devDeps |
| `frontend/scripts/generate-icons.mjs` | Create | Generates `icon-192.png` + `icon-512.png` using sharp |
| `frontend/public/manifest.webmanifest` | Create | PWA manifest (name, icons, display: standalone) |
| `frontend/vite.config.ts` | Modify | Add `VitePWA` plugin with `injectManifest` strategy |
| `frontend/tsconfig.json` | Modify | Add `"webworker"` to lib (for SW TypeScript types) |
| `frontend/src/sw.ts` | Create | Workbox service worker: caching strategies + push handler |
| `frontend/src/lib/persister.ts` | Create | idb-keyval IndexedDB persister for TanStack Query |
| `frontend/src/main.tsx` | Modify | Wrap with `PersistQueryClientProvider` |
| `frontend/src/hooks/useOnlineStatus.ts` | Create | `navigator.onLine` + event listeners |
| `frontend/src/components/OfflineBanner.tsx` | Create | Yellow banner when offline |
| `frontend/src/hooks/usePushNotifications.ts` | Create | Requests permission + subscribes on first login |
| `frontend/src/lib/api.ts` | Modify | Add `subscribePush` and `unsubscribePush` API calls |
| `frontend/src/components/Layout.tsx` | Modify | Render `OfflineBanner`, call `usePushNotifications` |
| `frontend/src/pages/AISuggestions.tsx` | Modify | Show offline message + disable form when offline |

---

## Task 1: VAPID Key Generation + Backend Config

**Files:**
- Create: `backend/generate_vapid_keys.py`
- Modify: `backend/app/core/config.py`
- Modify: `.env` (root)
- Modify: `.env.example`

- [ ] **Step 1: Add pywebpush + apscheduler to requirements.txt**

Open `backend/requirements.txt` and append:
```
pywebpush==2.0.0
apscheduler==3.10.4
```

- [ ] **Step 2: Install new requirements**

```bash
cd backend
pip install pywebpush==2.0.0 apscheduler==3.10.4
```

Expected: installs without error.

- [ ] **Step 3: Create VAPID key generation script**

Create `backend/generate_vapid_keys.py`:
```python
"""Run once to generate VAPID keys. Output → paste into .env."""
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

key = ec.generate_private_key(ec.SECP256R1())
pub = key.public_key()

# Private key: raw 32-byte scalar as base64url (no padding)
priv_bytes = key.private_numbers().private_value.to_bytes(32, "big")
priv_b64 = base64.urlsafe_b64encode(priv_bytes).rstrip(b"=").decode()

# Public key: uncompressed EC point (65 bytes) as base64url
pub_bytes = pub.public_bytes(
    serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
)
pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode()

print("# Paste these into .env:")
print(f"VAPID_PRIVATE_KEY={priv_b64}")
print(f"VAPID_PUBLIC_KEY={pub_b64}")
print("VAPID_CLAIMS_SUB=mailto:mohamed.c.mzoughi@gmail.com")
```

- [ ] **Step 4: Run the key generator and copy output into .env**

```bash
cd backend
python generate_vapid_keys.py
```

Expected output (values will differ):
```
# Paste these into .env:
VAPID_PRIVATE_KEY=abc123...
VAPID_PUBLIC_KEY=BDef456...
VAPID_CLAIMS_SUB=mailto:mohamed.c.mzoughi@gmail.com
```

Open `.env` (root of project) and append the three lines.

- [ ] **Step 5: Update config.py to expose VAPID settings**

Replace the entire content of `backend/app/core/config.py`:
```python
from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8")

    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claims_sub: str = "mailto:admin@example.com"


settings = Settings()
```

- [ ] **Step 6: Update .env.example**

Append to `.env.example`:
```
VAPID_PRIVATE_KEY=<base64url-encoded-raw-private-key-scalar>
VAPID_PUBLIC_KEY=<base64url-encoded-uncompressed-public-key>
VAPID_CLAIMS_SUB=mailto:your@email.com
```

- [ ] **Step 7: Commit**

```bash
git add backend/requirements.txt backend/app/core/config.py backend/generate_vapid_keys.py .env.example
git commit -m "feat(pwa): add VAPID config and key generation script"
```

---

## Task 2: PushSubscription Model

**Files:**
- Create: `backend/app/models/push_subscription.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create the model**

Create `backend/app/models/push_subscription.py`:
```python
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    __table_args__ = (UniqueConstraint("endpoint"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    endpoint: Mapped[str] = mapped_column(String, nullable=False)
    p256dh: Mapped[str] = mapped_column(String, nullable=False)
    auth: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
```

- [ ] **Step 2: Export from models/__init__.py**

Replace the content of `backend/app/models/__init__.py`:
```python
from app.models.user import User
from app.models.recipe import Recipe
from app.models.meal_plan import MealPlan, MealPlanEntry
from app.models.shopping_list import ShoppingList, ShoppingListItem
from app.models.progress import ProgressLog
from app.models.push_subscription import PushSubscription
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/push_subscription.py backend/app/models/__init__.py
git commit -m "feat(pwa): add PushSubscription model"
```

---

## Task 3: Push Service + Push Router

**Files:**
- Create: `backend/app/services/push_service.py`
- Create: `backend/app/routers/push.py`
- Create: `backend/tests/test_push.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_push.py`:
```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_subscribe_creates_subscription(client: AsyncClient, auth_headers: dict):
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
        "keys": {"p256dh": "test-p256dh-key", "auth": "test-auth-key"},
    }
    resp = await client.post("/push/subscribe", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json() == {"status": "subscribed"}


@pytest.mark.asyncio
async def test_subscribe_upserts_on_same_user(client: AsyncClient, auth_headers: dict):
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/endpoint-a",
        "keys": {"p256dh": "key-a", "auth": "auth-a"},
    }
    await client.post("/push/subscribe", json=payload, headers=auth_headers)

    payload2 = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/endpoint-b",
        "keys": {"p256dh": "key-b", "auth": "auth-b"},
    }
    resp = await client.post("/push/subscribe", json=payload2, headers=auth_headers)
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_unsubscribe(client: AsyncClient, auth_headers: dict):
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/test-del",
        "keys": {"p256dh": "key", "auth": "auth"},
    }
    await client.post("/push/subscribe", json=payload, headers=auth_headers)
    resp = await client.delete("/push/subscribe", headers=auth_headers)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_subscribe_requires_auth(client: AsyncClient):
    resp = await client.post("/push/subscribe", json={
        "endpoint": "x", "keys": {"p256dh": "x", "auth": "x"}
    })
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
pytest tests/test_push.py -v
```

Expected: FAIL — `404 Not Found` because the router doesn't exist yet.

- [ ] **Step 3: Create push_service.py**

Create `backend/app/services/push_service.py`:
```python
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
```

- [ ] **Step 4: Create push router**

Create `backend/app/routers/push.py`:
```python
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.push_subscription import PushSubscription
from app.models.user import User

router = APIRouter()


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class SubscribePayload(BaseModel):
    endpoint: str
    keys: PushKeys


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe(
    payload: SubscribePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
    )
    db.add(sub)
    await db.commit()
    return {"status": "subscribed"}


@router.delete("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    await db.commit()
```

- [ ] **Step 5: Register router in main.py**

In `backend/app/main.py`, add the push router import and `include_router` call.

Replace the imports block and the `include_router` section:
```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.core.database import Base
from app.routers import auth, recipes, meal_plans, shopping_lists, progress, ai
from app.routers import push


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    yield


app = FastAPI(title="Diet Planner API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
app.include_router(meal_plans.router, prefix="/meal-plans", tags=["meal-plans"])
app.include_router(shopping_lists.router, prefix="/shopping-lists", tags=["shopping-lists"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(push.router, prefix="/push", tags=["push"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Run tests and confirm they pass**

```bash
cd backend
pytest tests/test_push.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/push_service.py backend/app/routers/push.py \
        backend/app/main.py backend/tests/test_push.py
git commit -m "feat(pwa): add push subscription router and service"
```

---

## Task 4: APScheduler Daily Reminders

**Files:**
- Create: `backend/app/services/scheduler.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create scheduler.py**

Create `backend/app/services/scheduler.py`:
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.push_service import send_push_to_all

scheduler = AsyncIOScheduler()


def setup_scheduler() -> None:
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=7, minute=30),
        args=["Breakfast time! 🍳", "Good morning! Check today's meal plan"],
    )
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=12, minute=0),
        args=["Lunch time! 🥗", "Time for lunch — see what's planned"],
    )
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=18, minute=0),
        args=["Dinner time! 🍽️", "Dinner time — check your meal plan"],
    )
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=20, minute=0),
        args=["Track progress 📊", "Don't forget to log today's progress"],
    )
    scheduler.start()
```

- [ ] **Step 2: Wire scheduler into main.py lifespan**

Replace the `lifespan` function in `backend/app/main.py`:
```python
from app.services.scheduler import setup_scheduler, scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    setup_scheduler()
    yield
    scheduler.shutdown(wait=False)
```

- [ ] **Step 3: Verify server starts without errors**

```bash
cd backend
uvicorn app.main:app --reload
```

Expected: server starts, no import errors, no scheduler errors in logs.  
Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/scheduler.py backend/app/main.py
git commit -m "feat(pwa): add APScheduler daily meal reminders"
```

---

## Task 5: Calorie Goal Alert in Meal Plan Entries

**Files:**
- Modify: `backend/app/routers/meal_plans.py`

- [ ] **Step 1: Add calorie alert logic to add_entry**

In `backend/app/routers/meal_plans.py`, add these imports at the top:
```python
from datetime import date
from app.models.recipe import Recipe
from app.services.push_service import send_push_to_user
```

Then replace the `add_entry` endpoint with:
```python
@router.post("/{plan_id}/entries", response_model=MealPlanEntryOut, status_code=201)
async def add_entry(
    plan_id: int,
    body: MealPlanEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meal plan not found")
    entry = MealPlanEntry(meal_plan_id=plan_id, **body.model_dump(mode="json"))
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Fire calorie alert if today's planned calories cross 80% of target
    today_dow = date.today().weekday()  # 0=Mon, matches day_of_week field
    if body.day_of_week == today_dow:
        entries_result = await db.execute(
            select(MealPlanEntry).where(
                MealPlanEntry.meal_plan_id == plan_id,
                MealPlanEntry.day_of_week == today_dow,
            )
        )
        today_entries = entries_result.scalars().all()
        total: float = 0.0
        for e in today_entries:
            if e.calories_override is not None:
                total += e.calories_override
            elif e.recipe_id is not None:
                r_res = await db.execute(select(Recipe).where(Recipe.id == e.recipe_id))
                recipe = r_res.scalar_one_or_none()
                if recipe:
                    total += recipe.calories * e.servings
        target = current_user.daily_calorie_target
        if total >= target * 0.8:
            await send_push_to_user(
                current_user.id,
                "Calorie Goal Alert 🎯",
                f"You're at {int(total)} kcal — {int(target - total)} kcal left today!",
                db,
            )

    return entry
```

- [ ] **Step 2: Verify existing meal plan tests still pass**

```bash
cd backend
pytest tests/test_meal_plans.py -v
```

Expected: all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/meal_plans.py
git commit -m "feat(pwa): fire push notification when today's calories hit 80% of target"
```

---

## Task 6: Frontend — App Icons + PWA Manifest

**Files:**
- Create: `frontend/scripts/generate-icons.mjs`
- Create: `frontend/public/manifest.webmanifest`
- Create: `frontend/public/icons/icon-192.png` (generated)
- Create: `frontend/public/icons/icon-512.png` (generated)
- Modify: `frontend/package.json`

- [ ] **Step 1: Add sharp as devDependency**

In `frontend/package.json`, add to `"devDependencies"`:
```json
"sharp": "^0.33.4"
```

Then install:
```bash
cd frontend
npm install
```

- [ ] **Step 2: Create icon generation script**

Create `frontend/scripts/generate-icons.mjs`:
```javascript
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#22c55e"/>
  <rect x="120" y="200" width="272" height="48" rx="24" fill="white"/>
  <rect x="120" y="276" width="200" height="36" rx="18" fill="white" opacity="0.75"/>
  <rect x="120" y="132" width="160" height="36" rx="18" fill="white" opacity="0.75"/>
  <circle cx="360" cy="152" r="56" fill="white" opacity="0.2"/>
</svg>`)

for (const size of [192, 512]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(
    join(iconsDir, `icon-${size}.png`)
  )
  console.log(`Generated icon-${size}.png`)
}
```

- [ ] **Step 3: Generate the icons**

```bash
cd frontend
node scripts/generate-icons.mjs
```

Expected:
```
Generated icon-192.png
Generated icon-512.png
```

Verify files exist at `frontend/public/icons/icon-192.png` and `icon-512.png`.

- [ ] **Step 4: Update index.html with manifest link and theme-color**

Since we use `manifest: false` in vite-plugin-pwa (our own manifest file), the plugin won't auto-inject the link. Replace the entire content of `frontend/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>Diet Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create the PWA manifest**

Create `frontend/public/manifest.webmanifest`:
```json
{
  "name": "Diet Planner",
  "short_name": "DietPlan",
  "description": "Family meal planning and diet tracking app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/index.html \
        frontend/package.json frontend/package-lock.json \
        frontend/scripts/generate-icons.mjs \
        frontend/public/manifest.webmanifest \
        frontend/public/icons/
git commit -m "feat(pwa): add app icons, web manifest, and index.html meta tags"
```

---

## Task 7: Vite PWA Plugin + TypeScript Config

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`

- [ ] **Step 1: Install vite-plugin-pwa and Workbox packages**

Add to `"dependencies"` in `frontend/package.json`:
```json
"workbox-precaching": "^7.1.0",
"workbox-routing": "^7.1.0",
"workbox-strategies": "^7.1.0",
"workbox-background-sync": "^7.1.0"
```

Add to `"devDependencies"` in `frontend/package.json`:
```json
"vite-plugin-pwa": "^0.20.1"
```

Then:
```bash
cd frontend
npm install
```

- [ ] **Step 2: Add /push proxy to vite.config.ts and register VitePWA**

Replace the entire content of `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        swSrc: 'src/sw.ts',
        swDest: 'dist/sw.js',
      },
      manifest: false,        // we use our own public/manifest.webmanifest
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/recipes': 'http://localhost:8000',
      '/meal-plans': 'http://localhost:8000',
      '/shopping-lists': 'http://localhost:8000',
      '/progress': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/push': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
        },
      },
    },
  },
})
```

- [ ] **Step 3: Add webworker lib to tsconfig.json**

Open `frontend/tsconfig.json`. In `compilerOptions`, update the `"lib"` array to include `"webworker"`. If there is no `"lib"` key, add it. The result should be:
```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable", "webworker"],
    ...rest of existing options unchanged...
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend
npm run build
```

Expected: build succeeds (sw.ts doesn't exist yet — Vite will warn but not error at this stage since `injectManifest` source file is optional during config setup). If there is an error about missing `sw.ts`, proceed to Task 8 first, then re-run.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tsconfig.json
git commit -m "feat(pwa): configure vite-plugin-pwa with injectManifest strategy"
```

---

## Task 8: Service Worker

**Files:**
- Create: `frontend/src/sw.ts`

- [ ] **Step 1: Create the service worker**

Create `frontend/src/sw.ts`:
```typescript
/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: PrecacheEntry[] }

// Precache static build assets (includes index.html)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA fallback: serve cached index.html for all navigation requests
// This ensures /recipes, /meal-planner etc. work offline after a hard refresh
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

const bgSyncPlugin = new BackgroundSyncPlugin('mutations', {
  maxRetentionTime: 24 * 60, // retry for up to 24 hours
})

const API_PATHS = [
  '/auth/',
  '/recipes/',
  '/meal-plans/',
  '/progress/',
  '/shopping-lists/',
  '/push/',
]

const isApiPath = ({ url }: { url: URL }) =>
  API_PATHS.some((p) => url.pathname.startsWith(p))

// Static assets — cache-first
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new CacheFirst({ cacheName: 'static-v1' })
)

// API GET — network-first with cache fallback for offline
registerRoute(
  (ctx) => isApiPath(ctx) && ctx.request.method === 'GET',
  new NetworkFirst({ cacheName: 'api-v1', networkTimeoutSeconds: 10 })
)

// AI routes — always network-only (no offline, no sync)
registerRoute(
  ({ url }) => url.pathname.startsWith('/ai/'),
  new NetworkOnly()
)

// API mutations — network-only with background sync queue
registerRoute(
  (ctx) => isApiPath(ctx) && ctx.request.method === 'POST',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST'
)
registerRoute(
  (ctx) => isApiPath(ctx) && ctx.request.method === 'PUT',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'PUT'
)
registerRoute(
  (ctx) => isApiPath(ctx) && ctx.request.method === 'PATCH',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'PATCH'
)
registerRoute(
  (ctx) => isApiPath(ctx) && ctx.request.method === 'DELETE',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'DELETE'
)

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() as { title?: string; body?: string } | null
  event.waitUntil(
    self.registration.showNotification(data?.title ?? 'Diet Planner', {
      body: data?.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  )
})

// Open app on notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
```

- [ ] **Step 2: Build and confirm no TypeScript errors**

```bash
cd frontend
npm run build
```

Expected: build completes, `dist/sw.js` is generated.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/sw.ts
git commit -m "feat(pwa): add Workbox service worker with offline caching and push handler"
```

---

## Task 9: TanStack Query Cache Persistence

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/lib/persister.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Install persistence packages**

Add to `"dependencies"` in `frontend/package.json`:
```json
"@tanstack/react-query-persist-client": "^5.40.0",
"idb-keyval": "^6.2.1"
```

Then:
```bash
cd frontend
npm install
```

- [ ] **Step 2: Create the persister**

Create `frontend/src/lib/persister.ts`:
```typescript
import { get, set, del } from 'idb-keyval'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

const IDB_KEY = 'rq-cache'

export const idbPersister: Persister = {
  persistClient: (client: PersistedClient) => set(IDB_KEY, client),
  restoreClient: () => get<PersistedClient>(IDB_KEY),
  removeClient: () => del(IDB_KEY),
}
```

- [ ] **Step 3: Read the current main.tsx**

Read `frontend/src/main.tsx` to see its current content before editing.

- [ ] **Step 4: Wrap QueryClientProvider with PersistQueryClientProvider**

Replace the entire content of `frontend/src/main.tsx`. The only change is replacing `QueryClientProvider` with `PersistQueryClientProvider` and adding `persistOptions`. Here is the full file:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { idbPersister } from './lib/persister'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 5: Build and confirm no errors**

```bash
cd frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json \
        frontend/src/lib/persister.ts frontend/src/main.tsx
git commit -m "feat(pwa): persist TanStack Query cache to IndexedDB for offline reads"
```

---

## Task 10: Offline Status Hook + Offline Banner

**Files:**
- Create: `frontend/src/hooks/useOnlineStatus.ts`
- Create: `frontend/src/components/OfflineBanner.tsx`

- [ ] **Step 1: Create useOnlineStatus hook**

Create `frontend/src/hooks/useOnlineStatus.ts`:
```typescript
import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return isOnline
}
```

- [ ] **Step 2: Create OfflineBanner component**

Create `frontend/src/components/OfflineBanner.tsx`:
```tsx
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 text-sm font-medium py-2 px-4">
      <WifiOff size={14} />
      You're offline — showing cached data
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useOnlineStatus.ts frontend/src/components/OfflineBanner.tsx
git commit -m "feat(pwa): add useOnlineStatus hook and OfflineBanner component"
```

---

## Task 11: Layout + Push Notification Subscription

**Files:**
- Create: `frontend/src/hooks/usePushNotifications.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Add VITE_VAPID_PUBLIC_KEY to frontend env**

Create `frontend/.env` (new file):
```
VITE_VAPID_PUBLIC_KEY=<paste the VAPID_PUBLIC_KEY value from the root .env here>
```

- [ ] **Step 2: Add push API calls to api.ts**

In `frontend/src/lib/api.ts`, append at the end:
```typescript
// Push notifications
export const subscribePush = (data: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
  api.post('/push/subscribe', data)
export const unsubscribePush = () => api.delete('/push/subscribe')
```

- [ ] **Step 3: Create usePushNotifications hook**

Create `frontend/src/hooks/usePushNotifications.ts`:
```typescript
import { useEffect } from 'react'
import { subscribePush } from '../lib/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return
    if (!('Notification' in window)) return
    if (!('serviceWorker' in navigator)) return
    if (Notification.permission !== 'default') return

    const setup = async () => {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        const json = sub.toJSON()
        if (!json.endpoint || !json.keys) return
        await subscribePush({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        })
      } catch {
        // Subscription failed silently (user denied later or browser unsupported)
      }
    }

    const timer = setTimeout(setup, 3000)
    return () => clearTimeout(timer)
  }, [])
}
```

- [ ] **Step 4: Update Layout.tsx to render OfflineBanner and call usePushNotifications**

Replace the entire content of `frontend/src/components/Layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, CalendarDays, UtensilsCrossed, ShoppingCart,
  TrendingUp, Bot, User, Menu, LogOut,
} from 'lucide-react'
import OfflineBanner from './OfflineBanner'
import { usePushNotifications } from '../hooks/usePushNotifications'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meal-planner', icon: CalendarDays, label: 'Meal Planner' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/ai', icon: Bot, label: 'AI Suggestions' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'
  }`

interface SidebarContentProps {
  userName: string | undefined
  onNavClick: () => void
  onLogout: () => void
}

const SidebarContent = ({ userName, onNavClick, onLogout }: SidebarContentProps) => (
  <nav className="flex flex-col h-full">
    <div className="p-6 border-b">
      <h1 className="text-xl font-bold text-brand-600">Diet Planner</h1>
      <p className="text-sm text-gray-500 mt-1">{userName}</p>
    </div>
    <div className="flex-1 p-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} className={navLinkClass} onClick={onNavClick}>
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </div>
    <div className="p-4 border-t space-y-1">
      <NavLink to="/profile" className={navLinkClass} onClick={onNavClick}>
        <User size={18} />
        Profile
      </NavLink>
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  </nav>
)

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  usePushNotifications()

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 bg-white border-r flex-col flex-shrink-0">
          <SidebarContent userName={user?.name} onNavClick={() => {}} onLogout={logout} />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="relative z-50 w-64 bg-white flex flex-col">
              <SidebarContent userName={user?.name} onNavClick={() => setSidebarOpen(false)} onLogout={logout} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="md:hidden flex items-center px-4 h-14 bg-white border-b">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-600">
              <Menu size={22} />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-brand-600">Diet Planner</h1>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Build and confirm no TypeScript errors**

```bash
cd frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/.env frontend/src/hooks/usePushNotifications.ts \
        frontend/src/lib/api.ts frontend/src/components/Layout.tsx
git commit -m "feat(pwa): add push notification subscription and offline banner to layout"
```

---

## Task 12: AISuggestions Offline Guard

**Files:**
- Modify: `frontend/src/pages/AISuggestions.tsx`

- [ ] **Step 1: Read the current AISuggestions.tsx**

Read `frontend/src/pages/AISuggestions.tsx` to see the full component.

- [ ] **Step 2: Add offline guard**

At the top of `AISuggestions.tsx`, add the import:
```typescript
import { useOnlineStatus } from '../hooks/useOnlineStatus'
```

Inside `export default function AISuggestions()`, add this as the very first line of the function body (before all existing state):
```typescript
const isOnline = useOnlineStatus()
```

Then add this as the first return condition (before the existing JSX), right after the `useEffect` hooks but before the main `return`:
```tsx
if (!isOnline) {
  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center h-64 gap-4">
      <WifiOff size={40} className="text-gray-300" />
      <p className="text-gray-400 text-sm text-center">
        AI Suggestions require an internet connection.<br />
        Reconnect to use this feature.
      </p>
    </div>
  )
}
```

Also add `WifiOff` to the lucide-react import:
```typescript
import { Send, WifiOff } from 'lucide-react'
```

- [ ] **Step 3: Build and confirm no TypeScript errors**

```bash
cd frontend
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AISuggestions.tsx
git commit -m "feat(pwa): disable AI Suggestions when offline with informative message"
```

---

## Task 13: Final Integration Smoke Test + Branch Cleanup

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend
pytest -v
```

Expected: all tests pass.

- [ ] **Step 2: Start the full stack and verify PWA features**

```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in Chrome.

- [ ] **Step 3: Verify installability**

In Chrome DevTools → Application → Manifest — confirm the manifest loads with correct name, icons, and `display: standalone`.

In Chrome DevTools → Application → Service Workers — confirm the SW is registered and active.

Click the install prompt in the address bar (or use DevTools → Application → Manifest → "Add to homescreen"). The app should open as a standalone window.

- [ ] **Step 4: Verify offline caching**

1. Browse to Dashboard, Recipes, and Meal Planner while online (populate the cache)
2. In DevTools → Network → check "Offline"
3. Refresh — the offline banner should appear and cached data should still show

- [ ] **Step 5: Verify AI Suggestions offline guard**

With the Network set to Offline, navigate to `/ai`. Confirm the WifiOff icon and message appear instead of the chat interface.

- [ ] **Step 6: Final commit and push**

```bash
git log --oneline feature/pwa ^master
```

Confirm all feature commits are present, then push the branch:
```bash
git push -u origin feature/pwa
```
