import { create } from 'zustand';
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, upsertIngredients } from '../db/queries/recipes';
import type { Recipe, RecipeIngredient } from '../types';

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'created_at'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => Promise<number>;
  editRecipe: (id: number, updates: Partial<Omit<Recipe, 'id' | 'created_at'>>, ingredients?: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => Promise<void>;
  removeRecipe: (id: number) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  loading: false,
  fetchRecipes: async () => {
    set({ loading: true });
    const recipes = await getRecipes();
    set({ recipes, loading: false });
  },
  addRecipe: async (recipe, ingredients) => {
    const id = await createRecipe(recipe);
    if (ingredients.length) await upsertIngredients(id, ingredients);
    const recipes = await getRecipes();
    set({ recipes });
    return id;
  },
  editRecipe: async (id, updates, ingredients) => {
    await updateRecipe(id, updates);
    if (ingredients) await upsertIngredients(id, ingredients);
    const recipes = await getRecipes();
    set({ recipes });
  },
  removeRecipe: async (id) => {
    await deleteRecipe(id);
    set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) }));
  },
}));
