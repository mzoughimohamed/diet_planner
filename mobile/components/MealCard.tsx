import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MealPlanEntry } from '../types';

interface Props {
  entry: MealPlanEntry;
  onDelete: (id: number) => void;
}

export function MealCard({ entry, onDelete }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View>
        <Text style={{ fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>{entry.meal_type}</Text>
        <Text style={{ color: '#6b7280', fontSize: 13 }}>{entry.custom_name ?? 'Recipe'} · {entry.calories} kcal</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(entry.id)}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}
