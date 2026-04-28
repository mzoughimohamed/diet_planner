export interface Profile {
  id: number;
  name: string;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
}

export interface Recipe {
  id: number;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  servings: number;
  photo_uri: string | null;
  created_at: string;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  name: string;
  amount: number;
  unit: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanEntry {
  id: number;
  date: string;
  meal_type: MealType;
  recipe_id: number | null;
  custom_name: string | null;
  servings: number;
  calories: number;
}

export interface ShoppingItem {
  id: number;
  name: string;
  amount: number;
  unit: string;
  checked: number;
  created_at: string;
}

export interface ProgressEntry {
  id: number;
  date: string;
  calories_consumed: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number | null;
  notes: string | null;
}

export interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: MealPlanEntry[];
}
