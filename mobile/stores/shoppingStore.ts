import { create } from 'zustand';
import { getItems, addItem, toggleItem, deleteItem, clearChecked, addFromPlan } from '../db/queries/shoppingList';
import type { ShoppingItem } from '../types';

interface ShoppingState {
  items: ShoppingItem[];
  fetchItems: () => Promise<void>;
  addShoppingItem: (item: Pick<ShoppingItem, 'name' | 'amount' | 'unit'>) => Promise<void>;
  toggleShoppingItem: (id: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
  addItemsFromPlan: (date: string) => Promise<void>;
}

export const useShoppingStore = create<ShoppingState>((set) => ({
  items: [],
  fetchItems: async () => {
    const items = await getItems();
    set({ items });
  },
  addShoppingItem: async (item) => {
    await addItem(item);
    const items = await getItems();
    set({ items });
  },
  toggleShoppingItem: async (id) => {
    await toggleItem(id);
    const items = await getItems();
    set({ items });
  },
  removeItem: async (id) => {
    await deleteItem(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
  clearCheckedItems: async () => {
    await clearChecked();
    const items = await getItems();
    set({ items });
  },
  addItemsFromPlan: async (date) => {
    await addFromPlan(date);
    const items = await getItems();
    set({ items });
  },
}));
