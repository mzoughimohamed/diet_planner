import { create } from 'zustand';
import { getProgress, upsertProgress, getProgressRange } from '../db/queries/progress';
import type { ProgressEntry } from '../types';

interface ProgressState {
  entries: ProgressEntry[];
  fetchRange: (from: string, to: string) => Promise<void>;
  logProgress: (entry: Omit<ProgressEntry, 'id'>) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  entries: [],
  fetchRange: async (from, to) => {
    const entries = await getProgressRange(from, to);
    set({ entries });
  },
  logProgress: async (entry) => {
    await upsertProgress(entry);
    const updated = await getProgress(entry.date);
    set((s) => {
      const others = s.entries.filter((e) => e.date !== entry.date);
      return { entries: updated ? [...others, updated].sort((a, b) => a.date.localeCompare(b.date)) : others };
    });
  },
}));
