import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb: any = {
  execAsync: (jest.fn() as any).mockResolvedValue(undefined),
  runAsync: (jest.fn() as any).mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getAllAsync: (jest.fn() as any).mockResolvedValue([]),
  getFirstAsync: (jest.fn() as any).mockResolvedValue(null),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openDatabaseAsync = (jest.fn() as any).mockResolvedValue(mockDb);
export const __mockDb = mockDb;
