import { View, Text } from 'react-native';

interface Props {
  label: string;
  consumed: number;
  goal: number;
  color: string;
}

export function MacroBar({ label, consumed, goal, color }: Props) {
  const pct = Math.min(consumed / (goal || 1), 1);
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>{Math.round(consumed)}g / {goal}g</Text>
      </View>
      <View style={{ height: 8, borderRadius: 99, backgroundColor: '#e5e7eb' }}>
        <View style={{ width: `${pct * 100}%`, backgroundColor: color, borderRadius: 99, height: 8 }} />
      </View>
    </View>
  );
}
