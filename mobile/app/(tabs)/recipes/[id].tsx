import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { useRecipeStore } from '../../../stores/recipeStore';
import { getRecipeIngredients } from '../../../db/queries/recipes';
import type { RecipeIngredient } from '../../../types';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipes, removeRecipe } = useRecipeStore();
  const recipe = recipes.find((r) => r.id === Number(id));
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  useEffect(() => {
    if (recipe) getRecipeIngredients(recipe.id).then(setIngredients);
  }, [recipe]);

  const handleDelete = () => {
    Alert.alert('Delete Recipe', `Delete "${recipe?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await removeRecipe(Number(id));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        }
      },
    ]);
  };

  const handleShare = async () => {
    if (!recipe) return;
    const lines = [
      `🍽️ ${recipe.name}`,
      recipe.description || '',
      '',
      'Nutrition (per serving):',
      `• Calories: ${recipe.calories} kcal`,
      `• Protein: ${recipe.protein}g`,
      `• Carbs: ${recipe.carbs}g`,
      `• Fat: ${recipe.fat}g`,
    ];
    if (ingredients.length) {
      lines.push('', 'Ingredients:');
      ingredients.forEach((i) => lines.push(`• ${i.amount} ${i.unit} ${i.name}`));
    }
    const text = lines.filter((l) => l !== undefined).join('\n');

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) { Alert.alert('Sharing not available on this device'); return; }

    // Write text to a temp file then share
    const fileUri = `${FileSystem.documentDirectory}recipe-${recipe.id}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: 'Share Recipe' });
  };

  if (!recipe) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9ca3af' }}>Recipe not found</Text>
      </View>
    );
  }

  const macros = [
    { label: 'Calories', value: `${recipe.calories} kcal` },
    { label: 'Protein', value: `${recipe.protein}g` },
    { label: 'Carbs', value: `${recipe.carbs}g` },
    { label: 'Fat', value: `${recipe.fat}g` },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {recipe.photo_uri ? (
        <Image source={{ uri: recipe.photo_uri }} style={{ width: '100%', height: 220 }} />
      ) : (
        <View style={{ width: '100%', height: 220, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64 }}>🍽️</Text>
        </View>
      )}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 12 }}>{recipe.name}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        {recipe.description ? (
          <Text style={{ color: '#6b7280', marginBottom: 16 }}>{recipe.description}</Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {macros.map(({ label, value }) => (
            <View key={label} style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, paddingVertical: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
              <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</Text>
              <Text style={{ fontWeight: '600', color: '#111827', fontSize: 13 }}>{value}</Text>
            </View>
          ))}
        </View>

        {ingredients.length > 0 && (
          <>
            <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Ingredients</Text>
            {ingredients.map((ing) => (
              <Text key={ing.id} style={{ color: '#4b5563', marginBottom: 4 }}>
                • {ing.amount} {ing.unit} {ing.name}
              </Text>
            ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}
