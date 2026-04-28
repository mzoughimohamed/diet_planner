import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRecipeStore } from '../../../stores/recipeStore';
import { useMealPlanStore } from '../../../stores/mealPlanStore';
import type { MealType, Recipe } from '../../../types';

export default function AddMeal() {
  const { date, meal_type } = useLocalSearchParams<{ date: string; meal_type: MealType }>();
  const router = useRouter();
  const { recipes, fetchRecipes } = useRecipeStore();
  const { addMealEntry } = useMealPlanStore();
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');

  useEffect(() => { fetchRecipes(); }, []);

  const handleAddRecipe = async (recipe: Recipe) => {
    await addMealEntry({ date, meal_type, recipe_id: recipe.id, custom_name: recipe.name, servings: 1, calories: recipe.calories });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddCustom = async () => {
    if (!customName || !customCal) return;
    await addMealEntry({ date, meal_type, recipe_id: null, custom_name: customName, servings: 1, calories: Number(customCal) });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12, textTransform: 'capitalize' }}>
        Add to {meal_type}
      </Text>

      <Text style={{ fontWeight: '600', color: '#4b5563', marginBottom: 8 }}>From Recipes</Text>
      {recipes.length === 0 && (
        <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 12 }}>No recipes yet — create one in the Recipes tab.</Text>
      )}
      {recipes.map((r) => (
        <TouchableOpacity
          key={r.id}
          onPress={() => handleAddRecipe(r)}
          style={{ backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
        >
          <Text style={{ fontWeight: '500', color: '#111827' }}>{r.name}</Text>
          <Text style={{ color: '#9ca3af', fontSize: 13 }}>{r.calories} kcal</Text>
        </TouchableOpacity>
      ))}

      <Text style={{ fontWeight: '600', color: '#4b5563', marginTop: 20, marginBottom: 8 }}>Or Add Custom</Text>
      <TextInput
        style={{ backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' }}
        placeholder="Meal name"
        value={customName}
        onChangeText={setCustomName}
      />
      <TextInput
        style={{ backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
        placeholder="Calories"
        keyboardType="numeric"
        value={customCal}
        onChangeText={setCustomCal}
      />
      <TouchableOpacity
        onPress={handleAddCustom}
        style={{ backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Add Custom Meal</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
