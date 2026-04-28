import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden', flexDirection: 'row' }}
    >
      {recipe.photo_uri ? (
        <Image source={{ uri: recipe.photo_uri }} style={{ width: 80, height: 80 }} />
      ) : (
        <View style={{ width: 80, height: 80, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>🍽️</Text>
        </View>
      )}
      <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center' }}>
        <Text style={{ fontWeight: '600', color: '#111827', fontSize: 15 }}>{recipe.name}</Text>
        <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>{recipe.calories} kcal · {recipe.prep_time} min</Text>
      </View>
    </TouchableOpacity>
  );
}
