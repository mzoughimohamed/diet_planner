import { getDb } from '../schema';
import type { ShoppingItem } from '../../types';

export async function getItems(): Promise<ShoppingItem[]> {
  const db = await getDb();
  return db.getAllAsync<ShoppingItem>(
    'SELECT * FROM shopping_list ORDER BY checked ASC, created_at DESC'
  );
}

export async function addItem(item: Pick<ShoppingItem, 'name' | 'amount' | 'unit'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO shopping_list (name, amount, unit) VALUES (?, ?, ?)',
    [item.name, item.amount, item.unit]
  );
  return result.lastInsertRowId;
}

export async function toggleItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE shopping_list SET checked = ((checked | 1) - (checked & 1)) WHERE id = ?',
    [id]
  );
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM shopping_list WHERE id = ?', [id]);
}

export async function clearChecked(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM shopping_list WHERE checked = 1', []);
}

export async function addFromPlan(date: string): Promise<void> {
  const db = await getDb();
  const meals = await db.getAllAsync<{ recipe_id: number }>(
    'SELECT DISTINCT recipe_id FROM meal_plan WHERE date = ? AND recipe_id IS NOT NULL',
    [date]
  );
  for (const { recipe_id } of meals) {
    const ingredients = await db.getAllAsync<{ name: string; amount: number; unit: string }>(
      'SELECT name, amount, unit FROM recipe_ingredients WHERE recipe_id = ?',
      [recipe_id]
    );
    for (const ing of ingredients) {
      await db.runAsync(
        'INSERT INTO shopping_list (name, amount, unit) VALUES (?, ?, ?)',
        [ing.name, ing.amount, ing.unit]
      );
    }
  }
}
