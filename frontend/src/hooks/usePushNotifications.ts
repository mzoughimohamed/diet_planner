import { useEffect } from 'react'
import { subscribePush } from '../lib/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) {
    view[i] = raw.charCodeAt(i)
  }
  return view
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
