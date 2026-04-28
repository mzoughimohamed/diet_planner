import { getDb } from '../schema';
import type { ProgressEntry } from '../../types';

export async function getProgress(date: string): Promise<ProgressEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<ProgressEntry>('SELECT * FROM progress WHERE date = ?', [date]);
}

export async function upsertProgress(entry: Omit<ProgressEntry, 'id'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO progress (date, calories_consumed, protein, carbs, fat, weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entry.date, entry.calories_consumed, entry.protein, entry.carbs, entry.fat, entry.weight, entry.notes]
  );
}

export async function getProgressRange(from: string, to: string): Promise<ProgressEntry[]> {
  const db = await getDb();
  return db.getAllAsync<ProgressEntry>(
    'SELECT * FROM progress WHERE date BETWEEN ? AND ? ORDER BY date ASC',
    [from, to]
  );
}
