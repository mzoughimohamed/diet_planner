import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useProgressStore } from '../../stores/progressStore';
import { useToday } from '../../hooks/useToday';

type Range = '7d' | '30d';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function Progress() {
  const today = useToday();
  const { entries, fetchRange, logProgress } = useProgressStore();
  const [range, setRange] = useState<Range>('7d');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const days = range === '7d' ? 7 : 30;
    fetchRange(daysAgo(days), today);
  }, [range, today, fetchRange]);

  const handleLogWeight = async () => {
    const parsed = parseFloat(weight);
    if (!weight || isNaN(parsed)) return;
    const existing = entries.find((e) => e.date === today);
    await logProgress({
      date: today,
      calories_consumed: existing?.calories_consumed ?? 0,
      protein: existing?.protein ?? 0,
      carbs: existing?.carbs ?? 0,
      fat: existing?.fat ?? 0,
      weight: parsed,
      notes,
    });
    setWeight(''); setNotes('');
    Alert.alert('Logged', 'Weight entry saved.');
  };

  const chartData = entries.map((e) => ({ day: e.date.slice(5), calories: e.calories_consumed }));
  const weightData = entries.filter((e) => e.weight).map((e) => ({ day: e.date.slice(5), weight: e.weight! }));

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Progress</Text>

      <View className="flex-row gap-2 mb-4">
        {(['7d', '30d'] as Range[]).map((r) => (
          <TouchableOpacity key={r} onPress={() => setRange(r)}
            className={`flex-1 py-2 rounded-xl items-center ${range === r ? 'bg-green-500' : 'bg-white border border-gray-200'}`}>
            <Text className={range === r ? 'text-white font-semibold' : 'text-gray-600'}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <Text className="font-semibold text-gray-700 mb-2">Calories ({range})</Text>
        {chartData.length > 1 ? (
          <CartesianChart data={chartData} xKey="day" yKeys={['calories']} axisOptions={{ font: null }}>
            {({ points }) => (
              <Line points={points.calories} color="#22c55e" strokeWidth={2} />
            )}
          </CartesianChart>
        ) : (
          <Text className="text-gray-400 text-center py-8">Not enough data yet</Text>
        )}
      </View>

      {weightData.length > 1 && (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="font-semibold text-gray-700 mb-2">Weight (kg)</Text>
          <CartesianChart data={weightData} xKey="day" yKeys={['weight']} axisOptions={{ font: null }}>
            {({ points }) => (
              <Line points={points.weight} color="#3b82f6" strokeWidth={2} />
            )}
          </CartesianChart>
        </View>
      )}

      <View className="bg-white rounded-2xl p-4 mb-8 shadow-sm">
        <Text className="font-semibold text-gray-700 mb-3">Log Today's Weight</Text>
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3 mb-2" placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3 mb-3" placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />
        <TouchableOpacity onPress={handleLogWeight} className="bg-green-500 rounded-xl py-3 items-center">
          <Text className="text-white font-semibold">Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
