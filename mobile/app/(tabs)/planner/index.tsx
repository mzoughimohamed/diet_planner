import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useToday } from '../../../hooks/useToday';

function getWeekDates(today: string): string[] {
  const d = new Date(today);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split('T')[0];
  });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerIndex() {
  const today = useToday();
  const router = useRouter();
  const week = getWeekDates(today);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>This Week</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {week.map((date, i) => {
          const isToday = date === today;
          return (
            <TouchableOpacity
              key={date}
              onPress={() => router.push(`/planner/day/${date}`)}
              style={{
                flex: 1,
                minWidth: 80,
                borderRadius: 16,
                padding: 12,
                alignItems: 'center',
                backgroundColor: isToday ? '#22c55e' : 'white',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: isToday ? 'white' : '#6b7280' }}>{DAY_LABELS[i]}</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4, color: isToday ? 'white' : '#111827' }}>
                {new Date(date + 'T00:00:00').getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
