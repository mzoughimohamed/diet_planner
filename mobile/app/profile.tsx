import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useProfileStore } from '../stores/profileStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function scheduleDailyReminder(hour: number, minute: number, title: string, body: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export default function ProfileModal() {
  const { profile, updateProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [calorieGoal, setCalorieGoal] = useState(String(profile?.calorie_goal ?? 2000));
  const [proteinGoal, setProteinGoal] = useState(String(profile?.protein_goal ?? 150));
  const [carbsGoal, setCarbsGoal] = useState(String(profile?.carbs_goal ?? 200));
  const [fatGoal, setFatGoal] = useState(String(profile?.fat_goal ?? 65));
  const [remindersOn, setRemindersOn] = useState(false);
  const [reminderHour, setReminderHour] = useState('8');
  const [reminderMin, setReminderMin] = useState('00');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCalorieGoal(String(profile.calorie_goal));
      setProteinGoal(String(profile.protein_goal));
      setCarbsGoal(String(profile.carbs_goal));
      setFatGoal(String(profile.fat_goal));
    }
  }, [profile]);

  const handleSave = async () => {
    const cal = Number(calorieGoal);
    const prot = Number(proteinGoal);
    const carbs = Number(carbsGoal);
    const fat = Number(fatGoal);
    if ([cal, prot, carbs, fat].some((v) => !Number.isFinite(v) || v < 0)) {
      Alert.alert('Invalid input', 'All goals must be positive numbers.');
      return;
    }
    try {
      await updateProfile({ name, calorie_goal: cal, protein_goal: prot, carbs_goal: carbs, fat_goal: fat });
      Alert.alert('Saved', 'Profile updated.');
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleToggleReminders = async (value: boolean) => {
    if (value) {
      const h = Number(reminderHour);
      const m = Number(reminderMin);
      if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) {
        Alert.alert('Invalid time', 'Hour must be 0–23, minute 0–59.');
        return;
      }
      try {
        const granted = await requestNotificationPermission();
        if (!granted) { Alert.alert('Permission denied', 'Enable notifications in Settings.'); return; }
        await scheduleDailyReminder(h, m, '🍽️ Meal reminder', "Don't forget to log your meals!");
      } catch {
        Alert.alert('Error', 'Could not schedule reminder. Please try again.');
        return;
      }
    } else {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch {
        // Best effort cancel
      }
    }
    setRemindersOn(value);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Profile & Goals</Text>

      {[
        { label: 'Your Name', value: name, set: setName },
        { label: 'Daily Calories (kcal)', value: calorieGoal, set: setCalorieGoal, numeric: true },
        { label: 'Protein Goal (g)', value: proteinGoal, set: setProteinGoal, numeric: true },
        { label: 'Carbs Goal (g)', value: carbsGoal, set: setCarbsGoal, numeric: true },
        { label: 'Fat Goal (g)', value: fatGoal, set: setFatGoal, numeric: true },
      ].map(({ label, value, set, numeric }) => (
        <View key={label} className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">{label}</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 border border-gray-200"
            value={value} onChangeText={set}
            keyboardType={numeric ? 'numeric' : 'default'}
          />
        </View>
      ))}

      <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold text-gray-700">Meal Reminders</Text>
          <Switch value={remindersOn} onValueChange={handleToggleReminders} trackColor={{ true: '#22c55e' }} />
        </View>
        {remindersOn && (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Hour (0-23)</Text>
              <TextInput className="border border-gray-200 rounded-xl px-3 py-2" keyboardType="numeric" value={reminderHour} onChangeText={setReminderHour} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Minute</Text>
              <TextInput className="border border-gray-200 rounded-xl px-3 py-2" keyboardType="numeric" value={reminderMin} onChangeText={setReminderMin} />
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={handleSave} className="bg-green-500 rounded-xl py-4 items-center mb-8">
        <Text className="text-white font-bold text-base">Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
