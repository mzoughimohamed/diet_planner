import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ShoppingItem as ShoppingItemType } from '../types';

interface Props {
  item: ShoppingItemType;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => void;
}

export function ShoppingItem({ item, onToggle, onDelete }: Props) {
  const handleToggle = async () => {
    await onToggle(item.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-2 shadow-sm">
      <TouchableOpacity onPress={handleToggle} className="mr-3">
        <Ionicons
          name={!!item.checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={!!item.checked ? '#22c55e' : '#9ca3af'}
        />
      </TouchableOpacity>
      <View className="flex-1">
        <Text className={`font-medium ${!!item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
        </Text>
        <Text className="text-gray-400 text-xs">{item.amount} {item.unit}</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(item.id)}>
        <Ionicons name="close-circle-outline" size={20} color="#d1d5db" />
      </TouchableOpacity>
    </View>
  );
}
