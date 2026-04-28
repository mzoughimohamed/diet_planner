import { jest } from '@jest/globals';

jest.mock('expo-sqlite');
jest.mock('../../db/schema', () => {
  const { __mockDb } = require('../../__mocks__/expo-sqlite');
  return { getDb: jest.fn().mockResolvedValue(__mockDb) };
});

import { __mockDb } from '../../__mocks__/expo-sqlite';
import { getMealsByDate, addMeal, deleteMeal } from '../../db/queries/mealPlan';

beforeEach(() => {
  jest.clearAllMocks();
});

test('getMealsByDate queries by date', async () => {
  __mockDb.getAllAsync.mockResolvedValueOnce([]);
  await getMealsByDate('2026-04-28');
  expect(__mockDb.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('WHERE date = ?'),
    ['2026-04-28']
  );
});

test('addMeal inserts and returns id', async () => {
  __mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 7, changes: 1 });
  const id = await addMeal({
    date: '2026-04-28',
    meal_type: 'lunch',
    recipe_id: null,
    custom_name: 'Banana',
    servings: 1,
    calories: 89,
  });
  expect(id).toBe(7);
});

test('deleteMeal removes by id', async () => {
  await deleteMeal(7);
  expect(__mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM meal_plan WHERE id = ?', [7]);
});
