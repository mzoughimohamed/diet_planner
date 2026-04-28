import { Stack } from 'expo-router';

export default function PlannerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Meal Planner' }} />
      <Stack.Screen name="day/[date]" options={{ title: 'Day Detail' }} />
      <Stack.Screen name="add-meal" options={{ presentation: 'modal', title: 'Add Meal' }} />
    </Stack>
  );
}
