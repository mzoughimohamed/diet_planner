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
