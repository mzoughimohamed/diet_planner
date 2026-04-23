export interface User {
  id: number
  email: string
  name: string
  avatar_url: string | null
  age: number | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  goal: 'lose' | 'maintain' | 'gain'
  activity_level: string
  daily_calorie_target: number
  created_at: string
}

export interface IngredientItem {
  name: string
  quantity?: number
  unit?: string
}

export interface Recipe {
  id: number
  user_id: number
  name: string
  description: string | null
  image_url: string | null
  prep_time_min: number | null
  servings: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  ingredients: IngredientItem[]
  instructions: string | null
  is_public: boolean
  created_at: string
}

export interface MealPlan {
  id: number
  user_id: number
  week_start_date: string
  name: string
  created_at: string
}

export interface MealPlanEntry {
  id: number
  meal_plan_id: number
  day_of_week: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe_id: number | null
  custom_meal_name: string | null
  servings: number
  calories_override: number | null
}

export interface MealPlanDetail extends MealPlan {
  entries: MealPlanEntry[]
}

export interface ShoppingListItem {
  id: number
  shopping_list_id: number
  ingredient_name: string
  quantity: number | null
  unit: string | null
  category: string
  is_checked: boolean
}

export interface ShoppingList {
  id: number
  user_id: number
  meal_plan_id: number
  generated_at: string
  items: ShoppingListItem[]
}

export interface ProgressLog {
  id: number
  user_id: number
  logged_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  notes: string | null
}
