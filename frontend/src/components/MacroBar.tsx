// frontend/src/components/MacroBar.tsx
interface MacroBarProps {
  protein: number
  carbs: number
  fat: number
}

export default function MacroBar({ protein, carbs, fat }: MacroBarProps) {
  const total = protein + carbs + fat || 1
  const segments = [
    { label: 'Protein', value: protein, color: 'bg-blue-500', pct: (protein / total) * 100 },
    { label: 'Carbs', value: carbs, color: 'bg-yellow-400', pct: (carbs / total) * 100 },
    { label: 'Fat', value: fat, color: 'bg-orange-400', pct: (fat / total) * 100 },
  ]

  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3">
        {segments.map((s) => (
          <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        {segments.map((s) => (
          <span key={s.label}>
            <span className={`inline-block w-2 h-2 rounded-full ${s.color} mr-1`} />
            {s.label} {s.value.toFixed(0)}g
          </span>
        ))}
      </div>
    </div>
  )
}
