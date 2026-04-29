import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useShoppingStore } from '../../stores/shoppingStore';
import { ShoppingItem } from '../../components/ShoppingItem';
import { useToday } from '../../hooks/useToday';

export default function Shopping() {
  const today = useToday();
  const { items, fetchItems, addShoppingItem, toggleShoppingItem, removeItem, clearCheckedItems, addItemsFromPlan } = useShoppingStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!name) return;
    await addShoppingItem({ name, amount: Number(amount) || 1, unit: unit || 'pcs' });
    setName(''); setAmount(''); setUnit('');
  };

  const handleClearChecked = () => {
    Alert.alert('Clear Checked', 'Remove all checked items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCheckedItems },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-gray-900">Shopping List</Text>
        <TouchableOpacity onPress={handleClearChecked}>
          <Text className="text-red-400 text-sm">Clear checked</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => addItemsFromPlan(today)}
        className="bg-green-50 border border-green-200 rounded-xl py-3 items-center mb-4"
      >
        <Text className="text-green-600 font-semibold">📅 Import from today's plan</Text>
      </TouchableOpacity>

      <View className="flex-row gap-2 mb-4">
        <TextInput className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-200" placeholder="Item name" value={name} onChangeText={setName} />
        <TextInput className="w-16 bg-white rounded-xl px-3 py-2 border border-gray-200" placeholder="Qty" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TextInput className="w-16 bg-white rounded-xl px-3 py-2 border border-gray-200" placeholder="Unit" value={unit} onChangeText={setUnit} />
        <TouchableOpacity onPress={handleAdd} className="bg-green-500 rounded-xl px-4 py-2 justify-center">
          <Text className="text-white font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {items.map((item) => (
        <ShoppingItem key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={removeItem} />
      ))}
      {items.length === 0 && <Text className="text-gray-400 text-center py-8">Your list is empty</Text>}
    </ScrollView>
  );
}
