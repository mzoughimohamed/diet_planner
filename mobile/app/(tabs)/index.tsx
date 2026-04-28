import { useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useMealPlanStore } from '../../stores/mealPlanStore';
import { useProfileStore } from '../../stores/profileStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { CalorieRing } from '../../components/CalorieRing';
import { MacroBar } from '../../components/MacroBar';
import { MealCard } from '../../components/MealCard';
import { useToday } from '../../hooks/useToday';

export default function Dashboard() {
  const today = useToday();
  const { mealsByDate, fetchMeals, removeMealEntry } = useMealPlanStore();
  const profile = useProfileStore((s) => s.profile);
  const { recipes, fetchRecipes } = useRecipeStore();
  const meals = mealsByDate[today] ?? [];

  useEffect(() => {
    fetchMeals(today);
    fetchRecipes();
  }, [today]);

  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + (m.recipe_id ? (recipeMap[m.recipe_id]?.protein ?? 0) * m.servings : 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.recipe_id ? (recipeMap[m.recipe_id]?.carbs ?? 0) * m.servings : 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.recipe_id ? (recipeMap[m.recipe_id]?.fat ?? 0) * m.servings : 0), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Today</Text>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <CalorieRing consumed={totalCal} goal={profile?.calorie_goal ?? 2000} />
      </View>
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Macros</Text>
        <MacroBar label="Protein" consumed={totalProtein} goal={profile?.protein_goal ?? 150} color="#3b82f6" />
        <MacroBar label="Carbs" consumed={totalCarbs} goal={profile?.carbs_goal ?? 200} color="#f59e0b" />
        <MacroBar label="Fat" consumed={totalFat} goal={profile?.fat_goal ?? 65} color="#ec4899" />
      </View>
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Meals</Text>
      {meals.length === 0 && (
        <Text style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 24 }}>No meals logged today</Text>
      )}
      {meals.map((m) => (
        <MealCard key={m.id} entry={m} onDelete={(id) => removeMealEntry(id, today)} />
      ))}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
