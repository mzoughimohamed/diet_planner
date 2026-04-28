import { jest } from '@jest/globals';

jest.mock('expo-sqlite');
jest.mock('../../db/schema', () => {
  const { __mockDb } = require('../../__mocks__/expo-sqlite');
  return { getDb: jest.fn().mockResolvedValue(__mockDb) };
});

import { __mockDb } from '../../__mocks__/expo-sqlite';
import { getRecipes, createRecipe, deleteRecipe } from '../../db/queries/recipes';

beforeEach(() => {
  jest.clearAllMocks();
});

test('getRecipes calls getAllAsync with correct SQL', async () => {
  __mockDb.getAllAsync.mockResolvedValueOnce([{ id: 1, name: 'Oats', calories: 300 }]);
  const result = await getRecipes();
  expect(__mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM recipes ORDER BY created_at DESC');
  expect(result[0].name).toBe('Oats');
});

test('createRecipe inserts and returns new id', async () => {
  __mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 5, changes: 1 });
  const id = await createRecipe({ name: 'Salad', description: '', calories: 150, protein: 5, carbs: 10, fat: 2, prep_time: 5, servings: 1, photo_uri: null });
  expect(id).toBe(5);
  expect(__mockDb.runAsync).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO recipes'),
    expect.arrayContaining(['Salad'])
  );
});

test('deleteRecipe calls runAsync with id', async () => {
  await deleteRecipe(3);
  expect(__mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM recipes WHERE id = ?', [3]);
});
