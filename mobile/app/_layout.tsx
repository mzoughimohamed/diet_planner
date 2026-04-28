import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { getDb } from '../db/schema';
import { useProfileStore } from '../stores/profileStore';

export default function RootLayout() {
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  useEffect(() => {
    getDb().then(() => fetchProfile());
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Profile & Goals' }} />
    </Stack>
  );
}
