import { jest } from '@jest/globals';

jest.mock('../../db/queries/recipes', () => ({
  getRecipes: jest.fn().mockResolvedValue([{ id: 1, name: 'Oats', calories: 300, protein: 10, carbs: 50, fat: 5, description: '', prep_time: 5, servings: 1, photo_uri: null, created_at: '2026-04-28' }]),
  deleteRecipe: jest.fn().mockResolvedValue(undefined),
  createRecipe: jest.fn().mockResolvedValue(99),
  updateRecipe: jest.fn().mockResolvedValue(undefined),
  upsertIngredients: jest.fn().mockResolvedValue(undefined),
}));

import { useRecipeStore } from '../../stores/recipeStore';

beforeEach(() => {
  jest.clearAllMocks();
});

test('fetchRecipes populates recipes', async () => {
  useRecipeStore.setState({ recipes: [], loading: false });
  await useRecipeStore.getState().fetchRecipes();
  expect(useRecipeStore.getState().recipes).toHaveLength(1);
  expect(useRecipeStore.getState().recipes[0].name).toBe('Oats');
});

test('removeRecipe removes from list', async () => {
  useRecipeStore.setState({
    recipes: [{ id: 1, name: 'Oats', calories: 300, protein: 10, carbs: 50, fat: 5, description: '', prep_time: 5, servings: 1, photo_uri: null, created_at: '2026-04-28' }],
    loading: false,
  });
  await useRecipeStore.getState().removeRecipe(1);
  expect(useRecipeStore.getState().recipes).toHaveLength(0);
});
