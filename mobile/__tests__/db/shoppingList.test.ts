import { jest } from '@jest/globals';

jest.mock('expo-sqlite');
jest.mock('../../db/schema', () => {
  const { __mockDb } = require('../../__mocks__/expo-sqlite');
  return { getDb: jest.fn().mockResolvedValue(__mockDb) };
});

import { __mockDb } from '../../__mocks__/expo-sqlite';
import { addItem, toggleItem, clearChecked } from '../../db/queries/shoppingList';

beforeEach(() => {
  jest.clearAllMocks();
});

test('addItem inserts and returns id', async () => {
  __mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 2, changes: 1 });
  const id = await addItem({ name: 'Milk', amount: 1, unit: 'L' });
  expect(id).toBe(2);
  expect(__mockDb.runAsync).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO shopping_list'),
    expect.arrayContaining(['Milk'])
  );
});

test('toggleItem flips checked with XOR', async () => {
  await toggleItem(4);
  expect(__mockDb.runAsync).toHaveBeenCalledWith(
    'UPDATE shopping_list SET checked = ((checked | 1) - (checked & 1)) WHERE id = ?',
    [4]
  );
});

test('clearChecked deletes checked=1 rows', async () => {
  await clearChecked();
  expect(__mockDb.runAsync).toHaveBeenCalledWith(
    'DELETE FROM shopping_list WHERE checked = 1',
    []
  );
});
