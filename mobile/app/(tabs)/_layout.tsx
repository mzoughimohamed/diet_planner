import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginRight: 16 }}>
            <Ionicons name="person-circle-outline" size={26} color="#22c55e" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="planner"
        options={{ title: 'Planner', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="recipes"
        options={{ title: 'Recipes', tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="shopping"
        options={{ title: 'Shopping', tabBarIcon: ({ color }) => <Ionicons name="cart" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
