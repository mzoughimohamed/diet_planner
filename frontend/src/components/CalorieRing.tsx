// frontend/src/components/CalorieRing.tsx
interface CalorieRingProps {
  eaten: number
  target: number
}

export default function CalorieRing({ eaten, target }: CalorieRingProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const safeTarget = target || 1
  const pct = Math.min(eaten / safeTarget, 1)
  const dash = pct * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={pct >= 1 ? '#ef4444' : '#22c55e'}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="mt-2 text-center">
        <p className="text-2xl font-bold text-gray-900">{eaten}</p>
        <p className="text-sm text-gray-500">of {target} kcal</p>
      </div>
    </div>
  )
}
