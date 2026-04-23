import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from 'lucide-react'
import {
  getMealPlans, getMealPlan, createMealPlan, addMealPlanEntry,
  deleteMealPlanEntry, getRecipes, generateShoppingList,
} from '../lib/api'
import MealSlot from '../components/MealSlot'
import type { Recipe } from '../lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function MealPlanner() {
  const queryClient = useQueryClient()
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [showAddModal, setShowAddModal] = useState<{ day: number; type: string } | null>(null)
  const weekStartStr = formatDate(weekStart)

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })
  const activePlan = plans.find((p) => p.week_start_date === weekStartStr)

  const { data: planDetail } = useQuery({
    queryKey: ['meal-plan', activePlan?.id],
    queryFn: () => getMealPlan(activePlan!.id),
    enabled: !!activePlan,
  })

  const { data: recipes = [] } = useQuery({ queryKey: ['recipes'], queryFn: getRecipes })

  const createPlanMutation = useMutation({
    mutationFn: () => createMealPlan({ week_start_date: weekStartStr, name: `Week of ${weekStartStr}` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plans'] }),
  })

  const addEntryMutation = useMutation({
    mutationFn: ({ recipeId }: { recipeId?: number }) =>
      addMealPlanEntry(activePlan!.id, {
        day_of_week: showAddModal!.day,
        meal_type: showAddModal!.type,
        recipe_id: recipeId ?? null,
        custom_meal_name: null,
        servings: 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', activePlan?.id] })
      setShowAddModal(null)
    },
  })

  const removeEntryMutation = useMutation({
    mutationFn: (entryId: number) => deleteMealPlanEntry(activePlan!.id, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan', activePlan?.id] }),
  })

  const generateListMutation = useMutation({
    mutationFn: () => generateShoppingList(activePlan!.id),
    onSuccess: () => alert('Shopping list generated! Check the Shopping List page.'),
  })

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  const getEntry = (day: number, type: string) =>
    planDetail?.entries.find((e) => e.day_of_week === day && e.meal_type === type)

  const getRecipeById = (recipeId: number | null) =>
    recipeId ? recipes.find((r: Recipe) => r.id === recipeId) : undefined

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Previous week"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">Week of {weekStartStr}</span>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Next week"><ChevronRight size={18} /></button>
        </div>
        {activePlan && (
          <button
            onClick={() => generateListMutation.mutate()}
            disabled={generateListMutation.isPending}
            className="flex items-center gap-2 bg-brand-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
          >
            <ShoppingCart size={14} /> Generate Shopping List
          </button>
        )}
      </div>

      {/* Create plan prompt */}
      {!activePlan && (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-gray-500 mb-4">No meal plan for this week.</p>
          <button
            onClick={() => createPlanMutation.mutate()}
            disabled={createPlanMutation.isPending}
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            <Plus size={16} /> Create Plan for This Week
          </button>
        </div>
      )}

      {/* Grid */}
      {activePlan && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="w-24 text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-2">Meal</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center text-xs font-semibold text-gray-500 uppercase pb-3 px-1">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((type) => (
                <tr key={type}>
                  <td className="pr-2 text-xs font-semibold text-gray-500 capitalize align-top pt-1">{type}</td>
                  {DAYS.map((_, day) => {
                    const entry = getEntry(day, type)
                    return (
                      <td key={day} className="px-1 pb-2">
                        <MealSlot
                          entry={entry}
                          recipe={getRecipeById(entry?.recipe_id ?? null)}
                          onAdd={() => setShowAddModal({ day, type })}
                          onRemove={() => entry && removeEntryMutation.mutate(entry.id)}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add meal modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Add {showAddModal.type} on {DAYS[showAddModal.day]}</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recipes.map((r: Recipe) => (
                <button
                  key={r.id}
                  onClick={() => addEntryMutation.mutate({ recipeId: r.id })}
                  disabled={addEntryMutation.isPending}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-50 text-sm disabled:opacity-60"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-gray-400 ml-2">{r.calories} kcal</span>
                </button>
              ))}
              {recipes.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No recipes. Add some first.</p>}
            </div>
            <button onClick={() => setShowAddModal(null)} className="w-full border rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
