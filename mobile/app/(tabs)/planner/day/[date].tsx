import { useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMealPlanStore } from '../../../../stores/mealPlanStore';
import { MealCard } from '../../../../components/MealCard';
import type { MealType } from '../../../../types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function DayDetail() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { mealsByDate, fetchMeals, removeMealEntry } = useMealPlanStore();
  const meals = mealsByDate[date] ?? [];

  useEffect(() => { fetchMeals(date); }, [date]);

  const handleDelete = async (id: number) => {
    await removeMealEntry(id, date);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>{date}</Text>
      {MEAL_TYPES.map((type) => {
        const typeMeals = meals.filter((m) => m.meal_type === type);
        return (
          <View key={type} style={{ marginBottom: 20 }}>
            <Text style={{ textTransform: 'capitalize', fontWeight: '600', color: '#6b7280', marginBottom: 6 }}>{type}</Text>
            {typeMeals.map((m) => <MealCard key={m.id} entry={m} onDelete={handleDelete} />)}
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/planner/add-meal', params: { date, meal_type: type } })}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontSize: 14 }}>Add {type}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
