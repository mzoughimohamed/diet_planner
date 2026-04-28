import { useEffect, useState } from 'react';
import { FlatList, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeStore } from '../../../stores/recipeStore';
import { RecipeCard } from '../../../components/RecipeCard';

export default function RecipesList() {
  const router = useRouter();
  const { recipes, fetchRecipes } = useRecipeStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchRecipes(); }, []);

  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 16 }}>
      <TextInput
        style={{ backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 14 }}
        placeholder="Search recipes..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipes/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Text style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 40 }}>No recipes yet</Text>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        onPress={() => router.push('/recipes/new')}
        style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: '#22c55e', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
