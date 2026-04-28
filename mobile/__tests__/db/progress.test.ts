import { jest } from '@jest/globals';

jest.mock('expo-sqlite');
jest.mock('../../db/schema', () => {
  const { __mockDb } = require('../../__mocks__/expo-sqlite');
  return { getDb: jest.fn().mockResolvedValue(__mockDb) };
});

import { __mockDb } from '../../__mocks__/expo-sqlite';
import { upsertProgress, getProgressRange } from '../../db/queries/progress';

beforeEach(() => {
  jest.clearAllMocks();
});

test('upsertProgress calls INSERT OR REPLACE', async () => {
  await upsertProgress({
    date: '2026-04-28',
    calories_consumed: 1800,
    protein: 120,
    carbs: 180,
    fat: 60,
    weight: 75,
    notes: null,
  });
  expect(__mockDb.runAsync).toHaveBeenCalledWith(
    expect.stringContaining('INSERT OR REPLACE INTO progress'),
    expect.arrayContaining(['2026-04-28', 1800])
  );
});

test('getProgressRange returns rows ordered by date', async () => {
  __mockDb.getAllAsync.mockResolvedValueOnce([{ date: '2026-04-27', calories_consumed: 1900 }]);
  const rows = await getProgressRange('2026-04-21', '2026-04-28');
  expect(__mockDb.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('WHERE date BETWEEN'),
    ['2026-04-21', '2026-04-28']
  );
  expect(rows.length).toBe(1);
});
