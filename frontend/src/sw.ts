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
  event.waitUntil(self.clients.openWindow('/'))
})
