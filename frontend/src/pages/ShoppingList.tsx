import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { getMealPlans, updateShoppingItem, addShoppingItem, generateShoppingList } from '../lib/api'
import type { ShoppingListItem } from '../lib/types'

export default function ShoppingList() {
  const queryClient = useQueryClient()
  const [newItem, setNewItem] = useState('')

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })
  const latestPlan = [...plans].sort((a, b) => b.id - a.id)[0]

  const { data: list, isLoading } = useQuery({
    queryKey: ['shopping-list', latestPlan?.id],
    queryFn: async () => {
      try {
        return await generateShoppingList(latestPlan!.id)
      } catch {
        return null
      }
    },
    enabled: !!latestPlan,
    staleTime: Infinity,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: number; checked: boolean }) => {
      if (!list) throw new Error('No list')
      return updateShoppingItem(list.id, itemId, { is_checked: checked })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', latestPlan?.id] }),
  })

  const addMutation = useMutation({
    mutationFn: () => {
      if (!list) throw new Error('No list')
      return addShoppingItem(list.id, { ingredient_name: newItem, category: 'other' })
    },
    onSuccess: () => {
      setNewItem('')
      queryClient.invalidateQueries({ queryKey: ['shopping-list', latestPlan?.id] })
    },
  })

  const categories = ['produce', 'meat', 'dairy', 'grains', 'other']

  const grouped = categories.reduce((acc, cat) => {
    const items = list?.items.filter((i: ShoppingListItem) => i.category === cat) ?? []
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, ShoppingListItem[]>)

  if (!latestPlan) return <div className="p-6 text-gray-400">Create a meal plan first to generate a shopping list.</div>
  if (isLoading) return <div className="p-6 text-gray-400">Loading…</div>

  const checked = list?.items.filter((i: ShoppingListItem) => i.is_checked).length ?? 0
  const total = list?.items.length ?? 0

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
        {total > 0 && <span className="text-sm text-gray-500">{checked}/{total} checked</span>}
      </div>

      {list && (
        <>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-2xl border p-4 space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide capitalize">{cat}</h2>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMutation.mutate({ itemId: item.id, checked: !item.is_checked })}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.is_checked ? 'bg-brand-500 border-brand-500' : 'border-gray-300 hover:border-brand-400'}`}
                    aria-label={item.is_checked ? 'Uncheck item' : 'Check item'}
                  >
                    {item.is_checked && <Check size={12} className="text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.ingredient_name}
                    {item.quantity && <span className="text-gray-400 ml-1">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={newItem} onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add item manually…"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) addMutation.mutate() }}
            />
            <button
              onClick={() => { if (newItem.trim()) addMutation.mutate() }}
              disabled={!newItem.trim() || addMutation.isPending}
              className="bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60"
              aria-label="Add item"
            >
              <Plus size={16} />
            </button>
          </div>
        </>
      )}

      {!list && !isLoading && (
        <p className="text-gray-400 text-sm">No shopping list yet. Generate one from the Meal Planner.</p>
      )}
    </div>
  )
}
