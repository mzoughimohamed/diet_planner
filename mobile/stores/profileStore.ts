import { create } from 'zustand';
import { getProfile, upsertProfile } from '../db/queries/profile';
import type { Profile } from '../types';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  fetchProfile: async () => {
    set({ loading: true });
    const profile = await getProfile();
    set({ profile, loading: false });
  },
  updateProfile: async (updates) => {
    await upsertProfile(updates);
    const profile = await getProfile();
    set({ profile });
  },
}));
