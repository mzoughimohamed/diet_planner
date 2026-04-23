import { Plus, X } from 'lucide-react'
import type { MealPlanEntry, Recipe } from '../lib/types'

interface MealSlotProps {
  entry: MealPlanEntry | undefined
  recipe: Recipe | undefined
  onAdd: () => void
  onRemove: () => void
}

export default function MealSlot({ entry, recipe, onAdd, onRemove }: MealSlotProps) {
  if (!entry) {
    return (
      <button
        onClick={onAdd}
        className="w-full h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-brand-400 hover:text-brand-400 transition-colors"
      >
        <Plus size={16} />
      </button>
    )
  }

  const label = recipe?.name ?? entry.custom_meal_name ?? 'Custom meal'
  const cals = entry.calories_override ?? recipe?.calories ?? 0

  return (
    <div className="relative w-full h-16 rounded-lg bg-brand-50 border border-brand-200 p-2 flex flex-col justify-between">
      <p className="text-xs font-medium text-brand-800 line-clamp-2 leading-tight">{label}</p>
      {cals > 0 && <p className="text-xs text-brand-500">{cals} kcal</p>}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-0.5 text-brand-300 hover:text-red-500"
        aria-label="Remove meal"
      >
        <X size={12} />
      </button>
    </div>
  )
}
