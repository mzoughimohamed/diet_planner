import { jest } from '@jest/globals';

jest.mock('../../db/queries/shoppingList', () => ({
  getItems: jest.fn().mockResolvedValue([{ id: 1, name: 'Milk', amount: 1, unit: 'L', checked: 0, created_at: '2026-04-28' }]),
  addItem: jest.fn().mockResolvedValue(1),
  toggleItem: jest.fn().mockResolvedValue(undefined),
  deleteItem: jest.fn().mockResolvedValue(undefined),
  clearChecked: jest.fn().mockResolvedValue(undefined),
  addFromPlan: jest.fn().mockResolvedValue(undefined),
}));

import { useShoppingStore } from '../../stores/shoppingStore';

beforeEach(() => jest.clearAllMocks());

test('fetchItems populates items', async () => {
  useShoppingStore.setState({ items: [] });
  await useShoppingStore.getState().fetchItems();
  expect(useShoppingStore.getState().items).toHaveLength(1);
  expect(useShoppingStore.getState().items[0].name).toBe('Milk');
});

test('removeItem filters from list', async () => {
  useShoppingStore.setState({ items: [{ id: 1, name: 'Milk', amount: 1, unit: 'L', checked: 0, created_at: '2026-04-28' }] });
  await useShoppingStore.getState().removeItem(1);
  expect(useShoppingStore.getState().items).toHaveLength(0);
});
