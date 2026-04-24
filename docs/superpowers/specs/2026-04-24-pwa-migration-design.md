# PWA Migration Design
**Date:** 2026-04-24  
**Branch:** `feature/pwa`  
**Approach:** Option C — Workbox + TanStack Query cache persistence

---

## Goal

Convert the existing React + FastAPI Diet Planner web app into an installable Progressive Web App (PWA) that works fully offline (except AI Suggestions), supports background sync for queued writes, and sends push notifications for meal reminders and calorie goal alerts.

---

## Architecture

The backend remains the single source of truth. The FastAPI REST API is unchanged except for two additions: push subscription storage and a daily notification scheduler.

The PWA layer sits entirely in the frontend build pipeline and service worker:

```
Browser
  └── React App (unchanged)
        └── TanStack Query (existing)
              └── Query Persister → IndexedDB (new — auto-persists all cached data)
  └── Service Worker (new)
        ├── Workbox: cache-first for assets, network-first for API GETs
        ├── Background Sync: queues failed mutations when offline
        └── Push handler: shows notification banners
```

All existing pages and components remain untouched except `AISuggestions.tsx`, which gets a minimal offline guard. The `PersistQueryClientProvider` wrapping in `main.tsx` makes every `useQuery` call offline-readable automatically.

---

## Frontend Changes

### 1. PWA Manifest
`frontend/public/manifest.webmanifest` declares:
- `name`: "Diet Planner", `short_name`: "DietPlan"
- `display`: standalone (no browser chrome)
- `theme_color`: brand green (`#22c55e`)
- `background_color`: white
- Icons: 192×192 and 512×512 PNG in `public/icons/`

### 2. Vite PWA Plugin (`vite.config.ts`)
`vite-plugin-pwa` with Workbox runtime caching strategies:

| Pattern | Strategy | Purpose |
|---|---|---|
| `/assets/*`, fonts | cache-first | Static build artifacts |
| `/auth/*`, `/recipes/*`, `/meal-plans/*`, `/progress/*`, `/shopping-lists/*` | network-first | API data with offline fallback |
| `/ai/*` | network-only (no cache) | AI requires live API |

Background Sync queue named `"mutations"` captures POST/PUT/PATCH/DELETE requests that fail offline and replays them when connectivity is restored.

### 3. Query Cache Persistence (`src/lib/persister.ts`)
Uses `@tanstack/react-query-persist-client` + `idb-keyval`:
- Wraps `QueryClientProvider` in `main.tsx` with `PersistQueryClientProvider`
- Persists the full TanStack Query cache to IndexedDB
- Max cache age: 24 hours (prevents stale data surviving too long)

### 4. Offline UX
- `src/hooks/useOnlineStatus.ts` — reads `navigator.onLine`, listens to `online`/`offline` events
- `src/components/OfflineBanner.tsx` — thin banner shown when offline: "You're offline — showing cached data"
- `src/components/Layout.tsx` — renders `OfflineBanner`, triggers notification permission prompt after login
- `src/pages/AISuggestions.tsx` — shows "AI requires an internet connection" message with disabled inputs when offline

---

## Push Notifications

### Frontend
1. After login, prompt once for `Notification.requestPermission()`
2. On grant: `PushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
3. Send subscription (`endpoint`, `p256dh`, `auth`) to `POST /push/subscribe`
4. Service worker `push` event handler: calls `showNotification()` with title + body

### Backend

**New table: `push_subscriptions`**
```
id          INTEGER PK
user_id     INTEGER FK → users
endpoint    TEXT
p256dh      TEXT
auth        TEXT
created_at  DATETIME
```

**New endpoints:**
- `POST /push/subscribe` — upsert subscription for the authenticated user
- `DELETE /push/subscribe` — remove subscription

**Dependencies added to `requirements.txt`:**
- `pywebpush` — sends Web Push payloads with VAPID signing
- `apscheduler` — schedules daily reminder jobs

**VAPID keys** generated once, stored in `.env`:
```
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_CLAIMS_SUB=mailto:mohamed.c.mzoughi@gmail.com
```

### Notification Triggers

| Trigger | Schedule | Message |
|---|---|---|
| Breakfast reminder | 7:30 AM daily | "Good morning! Check today's meal plan" |
| Lunch reminder | 12:00 PM daily | "Time for lunch — see what's planned" |
| Dinner reminder | 6:00 PM daily | "Dinner time — check your meal plan" |
| Progress reminder | 8:00 PM daily | "Don't forget to log today's progress" |
| Calorie goal alert | On meal entry added (server-side) | "You're within 200 kcal of your daily target!" |

The calorie alert fires in `POST /meal-plans/{planId}/entries` when today's total planned calories for the user reach ≥ 80% of `daily_calorie_target`. (Progress logs track weight/body fat, not calorie intake — the meal plan entries are the calorie source of truth.)

---

## File Inventory

### New files
```
frontend/public/manifest.webmanifest
frontend/public/icons/icon-192.png
frontend/public/icons/icon-512.png
frontend/src/lib/persister.ts
frontend/src/hooks/useOnlineStatus.ts
frontend/src/components/OfflineBanner.tsx
frontend/src/sw.ts                        ← Workbox service worker + push handler

backend/app/models/push_subscription.py
backend/app/routers/push.py
backend/app/services/push_service.py      ← pywebpush wrapper
backend/app/services/scheduler.py         ← APScheduler daily jobs
```

### Modified files
```
frontend/package.json                     ← add vite-plugin-pwa, @tanstack/react-query-persist-client, idb-keyval
frontend/vite.config.ts                   ← register VitePWA plugin
frontend/src/main.tsx                     ← wrap with PersistQueryClientProvider
frontend/src/components/Layout.tsx        ← add OfflineBanner, notification permission prompt
frontend/src/pages/AISuggestions.tsx      ← offline message + disabled state

backend/app/main.py                       ← register /push router, start APScheduler on startup
backend/requirements.txt                  ← add pywebpush, apscheduler
```

### Unchanged
All existing pages (Dashboard, MealPlanner, Recipes, RecipeDetail, ShoppingList, Progress, Profile), all existing API routers, all existing components (CalorieRing, MacroBar, MealSlot, etc.), Docker setup, Alembic migrations (push_subscriptions added via new migration).

---

## Out of Scope
- App store submission (PWA is browser-installed, no store required)
- Conflict resolution for offline writes that conflict with server state (background sync replays in order; last-write-wins)
- Notification scheduling per user timezone (uses server local time for MVP)
