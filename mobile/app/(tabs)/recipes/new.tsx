import { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeStore } from '../../../stores/recipeStore';

export default function NewRecipe() {
  const router = useRouter();
  const { addRecipe } = useRecipeStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('1');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name || !calories) {
      Alert.alert('Required', 'Name and calories are required.');
      return;
    }
    await addRecipe(
      {
        name,
        description,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        prep_time: Number(prepTime) || 0,
        servings: Number(servings) || 1,
        photo_uri: photoUri,
      },
      []
    );
    router.back();
  };

  const fields = [
    { label: 'Name *', value: name, set: setName, numeric: false },
    { label: 'Description', value: description, set: setDescription, numeric: false },
    { label: 'Calories *', value: calories, set: setCalories, numeric: true },
    { label: 'Protein (g)', value: protein, set: setProtein, numeric: true },
    { label: 'Carbs (g)', value: carbs, set: setCarbs, numeric: true },
    { label: 'Fat (g)', value: fat, set: setFat, numeric: true },
    { label: 'Prep time (min)', value: prepTime, set: setPrepTime, numeric: true },
    { label: 'Servings', value: servings, set: setServings, numeric: true },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 110, height: 110, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 110, height: 110, backgroundColor: '#dcfce7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={36} color="#22c55e" />
          </View>
        )}
        <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={takePhoto}
            style={{ backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickPhoto}
            style={{ backgroundColor: 'white', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}
          >
            <Text style={{ color: '#374151', fontSize: 13 }}>🖼 Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {fields.map(({ label, value, set, numeric }) => (
        <View key={label} style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}>{label}</Text>
          <TextInput
            style={{ backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 14 }}
            value={value}
            onChangeText={set}
            keyboardType={numeric ? 'numeric' : 'default'}
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save Recipe</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
