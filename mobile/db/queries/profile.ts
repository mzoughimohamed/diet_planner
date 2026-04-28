import { getDb } from '../schema';
import type { Profile } from '../../types';

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  const row = await db.getFirstAsync<Profile>('SELECT * FROM profile WHERE id = 1');
  return row!;
}

export async function upsertProfile(updates: Partial<Omit<Profile, 'id'>>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);
  await db.runAsync(`UPDATE profile SET ${setClause} WHERE id = 1`, values);
}
