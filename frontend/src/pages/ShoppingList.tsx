import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Trash2 } from 'lucide-react'
import { getMealPlans, updateShoppingItem, addShoppingItem, deleteShoppingItem, generateShoppingList } from '../lib/api'
import type { ShoppingList, ShoppingListItem } from '../lib/types'

export default function ShoppingList() {
  const queryClient = useQueryClient()
  const [newItem, setNewItem] = useState('')

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })
  const latestPlan = [...plans].sort((a, b) => b.id - a.id)[0]

  const { data: list, isLoading, isError } = useQuery({
    queryKey: ['shopping-list', latestPlan?.id],
    queryFn: () => generateShoppingList(latestPlan!.id),
    enabled: !!latestPlan,
    staleTime: Infinity,
    retry: false,
  })

  const cacheKey = ['shopping-list', latestPlan?.id]

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: number; checked: boolean }) => {
      if (!list) throw new Error('No list')
      return updateShoppingItem(list.id, itemId, { is_checked: checked })
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(cacheKey, (old: ShoppingList | undefined) =>
        old ? { ...old, items: old.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)) } : old
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => {
      if (!list) throw new Error('No list')
      return deleteShoppingItem(list.id, itemId)
    },
    onSuccess: (_: void, itemId: number) => {
      queryClient.setQueryData(cacheKey, (old: ShoppingList | undefined) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== itemId) } : old
      )
    },
  })

  const addMutation = useMutation({
    mutationFn: () => {
      if (!list) throw new Error('No list')
      return addShoppingItem(list.id, { ingredient_name: newItem, category: 'other' })
    },
    onSuccess: (newItem) => {
      setNewItem('')
      queryClient.setQueryData(cacheKey, (old: ShoppingList | undefined) =>
        old ? { ...old, items: [...old.items, newItem] } : old
      )
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
  if (isError) return <div className="p-6 text-red-500">Failed to load shopping list. Please try again.</div>

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
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-40 flex-shrink-0"
                    aria-label="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
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

    </div>
  )
}
