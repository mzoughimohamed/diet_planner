import { create } from 'zustand';
import { getMealsByDate, addMeal, deleteMeal, getCalorieSumByDate } from '../db/queries/mealPlan';
import type { MealPlanEntry } from '../types';

interface MealPlanState {
  mealsByDate: Record<string, MealPlanEntry[]>;
  fetchMeals: (date: string) => Promise<void>;
  addMealEntry: (entry: Omit<MealPlanEntry, 'id'>) => Promise<void>;
  removeMealEntry: (id: number, date: string) => Promise<void>;
  getTodayCalories: (date: string) => Promise<number>;
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  mealsByDate: {},
  fetchMeals: async (date) => {
    const meals = await getMealsByDate(date);
    set((s) => ({ mealsByDate: { ...s.mealsByDate, [date]: meals } }));
  },
  addMealEntry: async (entry) => {
    await addMeal(entry);
    const meals = await getMealsByDate(entry.date);
    set((s) => ({ mealsByDate: { ...s.mealsByDate, [entry.date]: meals } }));
  },
  removeMealEntry: async (id, date) => {
    await deleteMeal(id);
    const meals = await getMealsByDate(date);
    set((s) => ({ mealsByDate: { ...s.mealsByDate, [date]: meals } }));
  },
  getTodayCalories: async (date) => getCalorieSumByDate(date),
}));
