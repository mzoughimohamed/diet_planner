import { Trash2, Edit } from 'lucide-react'
import type { Recipe } from '../lib/types'

interface RecipeCardProps {
  recipe: Recipe
  onEdit: () => void
  onDelete: () => void
}

export default function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{recipe.name}</h3>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-brand-500 rounded"><Edit size={14} /></button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
        </div>
      </div>
      {recipe.description && <p className="text-xs text-gray-500 line-clamp-2">{recipe.description}</p>}
      <div className="flex gap-3 text-xs text-gray-500 mt-auto pt-2 border-t">
        <span>{recipe.calories} kcal</span>
        <span>P: {recipe.protein_g}g</span>
        <span>C: {recipe.carbs_g}g</span>
        <span>F: {recipe.fat_g}g</span>
      </div>
      {recipe.is_public && <span className="text-xs text-brand-600 font-medium">Public</span>}
    </div>
  )
}
