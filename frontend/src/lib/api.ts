import axios from 'axios'
import type { MealPlan, MealPlanDetail, MealPlanEntry, ProgressLog, Recipe, ShoppingList, ShoppingListItem, User } from './types'

const api = axios.create({ withCredentials: true })

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !['/login', '/register'].includes(window.location.pathname)) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export interface RegisterPayload {
  email: string
  password: string
  name: string
  age?: number
  gender?: string
  height_cm?: number
  weight_kg?: number
  goal: string
  activity_level: string
}

// Auth
export const getMe = () => api.get<User>('/auth/me').then((r) => r.data)
export const login = (email: string, password: string) =>
  api.post<User>('/auth/login', { email, password }).then((r) => r.data)
export const register = (data: RegisterPayload) => api.post<User>('/auth/register', data).then((r) => r.data)
export const logout = () => api.post('/auth/logout')
export const updateMe = (data: object) => api.put<User>('/auth/me', data).then((r) => r.data)

// Recipes
export const getRecipes = (params?: object) => api.get<Recipe[]>('/recipes', { params }).then((r) => r.data)
export const getRecipe = (id: number) => api.get<Recipe>(`/recipes/${id}`).then((r) => r.data)
export const createRecipe = (data: object) => api.post<Recipe>('/recipes', data).then((r) => r.data)
export const updateRecipe = (id: number, data: object) => api.put<Recipe>(`/recipes/${id}`, data).then((r) => r.data)
export const deleteRecipe = (id: number) => api.delete(`/recipes/${id}`)

// Meal Plans
export const getMealPlans = () => api.get<MealPlan[]>('/meal-plans').then((r) => r.data)
export const getMealPlan = (id: number) => api.get<MealPlanDetail>(`/meal-plans/${id}`).then((r) => r.data)
export const createMealPlan = (data: object) => api.post<MealPlan>('/meal-plans', data).then((r) => r.data)
export const addMealPlanEntry = (planId: number, data: object) =>
  api.post<MealPlanEntry>(`/meal-plans/${planId}/entries`, data).then((r) => r.data)
export const updateMealPlanEntry = (planId: number, entryId: number, data: object) =>
  api.put<MealPlanEntry>(`/meal-plans/${planId}/entries/${entryId}`, data).then((r) => r.data)
export const deleteMealPlanEntry = (planId: number, entryId: number) =>
  api.delete(`/meal-plans/${planId}/entries/${entryId}`)
export const generateShoppingList = (planId: number) =>
  api.post<ShoppingList>(`/meal-plans/${planId}/shopping-list`).then((r) => r.data)

// Shopping Lists
export const getShoppingList = (id: number) => api.get<ShoppingList>(`/shopping-lists/${id}`).then((r) => r.data)
export const addShoppingItem = (listId: number, data: object) =>
  api.post<ShoppingListItem>(`/shopping-lists/${listId}/items`, data).then((r) => r.data)
export const updateShoppingItem = (listId: number, itemId: number, data: object) =>
  api.patch<ShoppingListItem>(`/shopping-lists/${listId}/items/${itemId}`, data).then((r) => r.data)
export const deleteShoppingItem = (listId: number, itemId: number) =>
  api.delete(`/shopping-lists/${listId}/items/${itemId}`)

// Progress
export const getProgress = (params?: object) => api.get<ProgressLog[]>('/progress', { params }).then((r) => r.data)
export const logProgress = (data: object) => api.post<ProgressLog>('/progress', data).then((r) => r.data)
export const deleteProgress = (id: number) => api.delete(`/progress/${id}`)
