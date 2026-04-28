import { getDb } from '../schema';
import type { Recipe, RecipeIngredient } from '../../types';

export async function getRecipes(): Promise<Recipe[]> {
  const db = await getDb();
  return db.getAllAsync<Recipe>('SELECT * FROM recipes ORDER BY created_at DESC');
}

export async function getRecipe(id: number): Promise<Recipe | null> {
  const db = await getDb();
  return db.getFirstAsync<Recipe>('SELECT * FROM recipes WHERE id = ?', [id]);
}

export async function getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
  const db = await getDb();
  return db.getAllAsync<RecipeIngredient>(
    'SELECT * FROM recipe_ingredients WHERE recipe_id = ?',
    [recipeId]
  );
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO recipes (name, description, calories, protein, carbs, fat, prep_time, servings, photo_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [recipe.name, recipe.description, recipe.calories, recipe.protein, recipe.carbs, recipe.fat, recipe.prep_time, recipe.servings, recipe.photo_uri]
  );
  return result.lastInsertRowId;
}

export async function updateRecipe(id: number, updates: Partial<Omit<Recipe, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = [...fields.map((f) => updates[f]), id];
  await db.runAsync(`UPDATE recipes SET ${setClause} WHERE id = ?`, values);
}

export async function deleteRecipe(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

export async function upsertIngredients(
  recipeId: number,
  ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]
): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
  for (const ing of ingredients) {
    await db.runAsync(
      'INSERT INTO recipe_ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
      [recipeId, ing.name, ing.amount, ing.unit]
    );
  }
}
