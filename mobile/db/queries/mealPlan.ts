import { getDb } from '../schema';
import type { MealPlanEntry } from '../../types';

export async function getMealsByDate(date: string): Promise<MealPlanEntry[]> {
  const db = await getDb();
  return db.getAllAsync<MealPlanEntry>(
    'SELECT * FROM meal_plan WHERE date = ? ORDER BY meal_type',
    [date]
  );
}

export async function addMeal(entry: Omit<MealPlanEntry, 'id'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO meal_plan (date, meal_type, recipe_id, custom_name, servings, calories) VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.date, entry.meal_type, entry.recipe_id, entry.custom_name, entry.servings, entry.calories]
  );
  return result.lastInsertRowId;
}

export async function deleteMeal(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meal_plan WHERE id = ?', [id]);
}

export async function getCalorieSumByDate(date: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(calories), 0) as total FROM meal_plan WHERE date = ?',
    [date]
  );
  return row?.total ?? 0;
}
