import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createRecipe, getRecipe, updateRecipe } from '../lib/api'
import type { IngredientItem } from '../lib/types'

const EMPTY_FORM = {
  name: '', description: '', prep_time_min: '', servings: '1',
  calories: '0', protein_g: '0', carbs_g: '0', fat_g: '0',
  instructions: '', is_public: false,
}

type FormShape = typeof EMPTY_FORM
type NumericKey = 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = !id || id === 'new'

  const [form, setForm] = useState<FormShape>(EMPTY_FORM)
  const [ingredients, setIngredients] = useState<IngredientItem[]>([])
  const [error, setError] = useState('')

  const { data: recipe } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(Number(id)),
    enabled: !isNew,
  })

  useEffect(() => {
    if (recipe) {
      setForm({
        name: recipe.name,
        description: recipe.description ?? '',
        prep_time_min: String(recipe.prep_time_min ?? ''),
        servings: String(recipe.servings),
        calories: String(recipe.calories),
        protein_g: String(recipe.protein_g),
        carbs_g: String(recipe.carbs_g),
        fat_g: String(recipe.fat_g),
        instructions: recipe.instructions ?? '',
        is_public: recipe.is_public,
      })
      setIngredients(recipe.ingredients)
    }
  }, [recipe])

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew ? createRecipe(data) : updateRecipe(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate('/recipes')
    },
    onError: () => setError('Failed to save recipe'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    saveMutation.mutate({
      ...form,
      prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : null,
      servings: Number(form.servings),
      calories: Number(form.calories),
      protein_g: Number(form.protein_g),
      carbs_g: Number(form.carbs_g),
      fat_g: Number(form.fat_g),
      ingredients,
    })
  }

  const set = (key: keyof FormShape) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const addIngredient = () => setIngredients((i) => [...i, { name: '', quantity: undefined, unit: '' }])
  const removeIngredient = (idx: number) => setIngredients((i) => i.filter((_, j) => j !== idx))
  const setIngredient = (idx: number, field: keyof IngredientItem, value: string) =>
    setIngredients((prev) => prev.map((item, j) =>
      j === idx ? { ...item, [field]: field === 'quantity' ? Number(value) || undefined : value } : item
    ))

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recipes')} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Recipe' : 'Edit Recipe'}</h1>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={set('name')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={set('description')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep time (min)</label>
              <input type="number" min="0" value={form.prep_time_min} onChange={set('prep_time_min')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input type="number" min="1" value={form.servings} onChange={set('servings')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Nutrition (per serving)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as NumericKey[]).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {key.replace('_g', '').replace('_', ' ')}{key !== 'calories' ? ' (g)' : ' (kcal)'}
                </label>
                <input type="number" min="0" step="0.1" value={form[key]} onChange={set(key)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Ingredients</h2>
            <button type="button" onClick={addIngredient} className="text-brand-600 text-sm font-medium flex items-center gap-1 hover:text-brand-700">
              <Plus size={14} /> Add
            </button>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input placeholder="Name" value={ing.name} onChange={(e) => setIngredient(idx, 'name', e.target.value)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input placeholder="Qty" type="number" value={ing.quantity ?? ''} onChange={(e) => setIngredient(idx, 'quantity', e.target.value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input placeholder="Unit" value={ing.unit ?? ''} onChange={(e) => setIngredient(idx, 'unit', e.target.value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button type="button" onClick={() => removeIngredient(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Instructions</h2>
          <textarea rows={4} value={form.instructions} onChange={set('instructions')} placeholder="Step-by-step instructions…" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={set('is_public')} className="rounded text-brand-500" />
            <span className="text-sm text-gray-700">Make this recipe public (visible to all family members)</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium text-sm hover:bg-brand-600 disabled:opacity-60">
            {saveMutation.isPending ? 'Saving…' : isNew ? 'Create Recipe' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/recipes')} className="px-6 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
