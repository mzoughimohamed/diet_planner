# Diet Planner Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive React web app with 8 pages (Dashboard, Meal Planner, Recipes, Shopping List, Progress, AI Suggestions, Profile, Auth) that consumes the Diet Planner FastAPI backend.

**Architecture:** React 18 SPA with Vite, React Router v6 for routing, React Query for server state, TailwindCSS for styling, Recharts for charts. JWT auth via httpOnly cookies managed by the backend — frontend just checks `/auth/me`. Served by Nginx in Docker.

**Tech Stack:** React 18, TypeScript, Vite 5, TailwindCSS 3, React Router v6, @tanstack/react-query v5, axios, Recharts, Nginx (Docker)

**Prerequisite:** Backend plan must be complete and running at `http://localhost:8000`.

---

## File Map

```
frontend/
  Dockerfile
  nginx.conf
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  index.html
  src/
    main.tsx
    App.tsx
    lib/
      api.ts           ← axios instance + typed request helpers
      auth.ts          ← auth query helpers
    contexts/
      AuthContext.tsx  ← current user state + logout
    components/
      Layout.tsx       ← sidebar nav + mobile hamburger
      ProtectedRoute.tsx
      CalorieRing.tsx
      MacroBar.tsx
      WeekGrid.tsx
      MealSlot.tsx
      RecipeCard.tsx
      ChatMessage.tsx
    pages/
      Login.tsx
      Register.tsx
      Dashboard.tsx
      MealPlanner.tsx
      Recipes.tsx
      RecipeDetail.tsx
      ShoppingList.tsx
      Progress.tsx
      AISuggestions.tsx
      Profile.tsx
```

---

## Task 1: Vite + React + TypeScript + Tailwind Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "diet-planner-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@tanstack/react-query": "^5.40.0",
    "axios": "^1.7.2",
    "recharts": "^2.12.7",
    "lucide-react": "^0.395.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Create frontend/vite.config.ts**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/recipes': 'http://localhost:8000',
      '/meal-plans': 'http://localhost:8000',
      '/shopping-lists': 'http://localhost:8000',
      '/progress': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
    },
  },
})
```

- [ ] **Step 3: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create frontend/tailwind.config.ts**

```typescript
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Create frontend/postcss.config.js**

```javascript
// frontend/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create frontend/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Diet Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create frontend/src/main.tsx**

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 8: Create frontend/src/index.css**

```css
/* frontend/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create frontend/Dockerfile**

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 10: Create frontend/nginx.conf**

```nginx
# frontend/nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(auth|recipes|meal-plans|shopping-lists|progress|ai) {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;  # required for SSE streaming
    }
}
```

- [ ] **Step 11: Install dependencies and verify dev server starts**

```bash
cd frontend
npm install
npm run dev
```

Expected: Vite dev server at http://localhost:5173

- [ ] **Step 12: Commit**

```bash
git add frontend/
git commit -m "feat: Vite + React + TypeScript + Tailwind project setup"
```

---

## Task 2: API Client + Auth Context + Types

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Create frontend/src/lib/types.ts**

```typescript
// frontend/src/lib/types.ts
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
```

- [ ] **Step 2: Create frontend/src/lib/api.ts**

```typescript
// frontend/src/lib/api.ts
import axios from 'axios'
import type { MealPlan, MealPlanDetail, MealPlanEntry, ProgressLog, Recipe, ShoppingList, ShoppingListItem, User } from './types'

const api = axios.create({ withCredentials: true })

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const getMe = () => api.get<User>('/auth/me').then((r) => r.data)
export const login = (email: string, password: string) =>
  api.post<User>('/auth/login', { email, password }).then((r) => r.data)
export const register = (data: object) => api.post<User>('/auth/register', data).then((r) => r.data)
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
```

- [ ] **Step 3: Create frontend/src/contexts/AuthContext.tsx**

```typescript
// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, logout as apiLogout } from '../lib/api'
import type { User } from '../lib/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true, logout: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user = null, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: Infinity,
  })

  const logout = async () => {
    await apiLogout()
    queryClient.clear()
    window.location.href = '/login'
  }

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 4: Create frontend/src/components/ProtectedRoute.tsx**

```typescript
// frontend/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/ frontend/src/contexts/ frontend/src/components/ProtectedRoute.tsx
git commit -m "feat: API client, types, auth context, and ProtectedRoute"
```

---

## Task 3: App Router + Layout Component

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Create frontend/src/App.tsx**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MealPlanner from './pages/MealPlanner'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import ShoppingList from './pages/ShoppingList'
import Progress from './pages/Progress'
import AISuggestions from './pages/AISuggestions'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/meal-planner" element={<MealPlanner />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/recipes/new" element={<RecipeDetail />} />
                    <Route path="/recipes/:id" element={<RecipeDetail />} />
                    <Route path="/shopping-list" element={<ShoppingList />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/ai" element={<AISuggestions />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Create stub pages so the app compiles**

Create each of these files with a minimal stub (replace with full implementation in later tasks):

`frontend/src/pages/Dashboard.tsx`:
```typescript
export default function Dashboard() { return <div className="p-6"><h1 className="text-2xl font-bold">Dashboard</h1></div> }
```

Repeat the same pattern for: `Login.tsx`, `Register.tsx`, `MealPlanner.tsx`, `Recipes.tsx`, `RecipeDetail.tsx`, `ShoppingList.tsx`, `Progress.tsx`, `AISuggestions.tsx`, `Profile.tsx` — each just renders its name in an h1.

- [ ] **Step 3: Create frontend/src/components/Layout.tsx**

```typescript
// frontend/src/components/Layout.tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, CalendarDays, UtensilsCrossed, ShoppingCart,
  TrendingUp, Bot, User, Menu, X, LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meal-planner', icon: CalendarDays, label: 'Meal Planner' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/ai', icon: Bot, label: 'AI Suggestions' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-brand-600">Diet Planner</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
      </div>
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t space-y-1">
        <NavLink to="/profile" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
          <User size={18} />
          Profile
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-64 bg-white flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center px-4 h-14 bg-white border-b">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-600">
            <Menu size={22} />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-brand-600">Diet Planner</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify app compiles and shows layout**

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 — should redirect to `/login` (since not authenticated). No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/Layout.tsx frontend/src/pages/
git commit -m "feat: app router, layout with responsive sidebar, stub pages"
```

---

## Task 4: Login + Register Pages

**Files:**
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Implement Login.tsx**

```typescript
// frontend/src/pages/Login.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { login } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      queryClient.setQueryData(['me'], user)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your Diet Planner account</p>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          No account? <Link to="/register" className="text-brand-600 font-medium">Register</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement Register.tsx**

```typescript
// frontend/src/pages/Register.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { register } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    age: '', gender: '', height_cm: '', weight_kg: '',
    goal: 'maintain', activity_level: 'moderate',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      }
      const user = await register(payload)
      queryClient.setQueryData(['me'], user)
      navigate('/')
    } catch {
      setError('Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, key: string, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type} required={required} value={(form as any)[key]}
        onChange={set(key)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Set up your diet profile</p>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Name', 'name', 'text', true)}
          {field('Email', 'email', 'email', true)}
          {field('Password', 'password', 'password', true)}
          <div className="grid grid-cols-2 gap-4">
            {field('Age', 'age', 'number')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={set('gender')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Height (cm)', 'height_cm', 'number')}
            {field('Weight (kg)', 'weight_kg', 'number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
            <select value={form.goal} onChange={set('goal')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity level</label>
            <select value={form.activity_level} onChange={set('activity_level')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="active">Active</option>
              <option value="very_active">Very active</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Have an account? <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test login/register manually**

Start the backend: `cd backend && uvicorn app.main:app --port 8000`
Start the frontend: `cd frontend && npm run dev`

1. Navigate to http://localhost:5173/register
2. Fill in the form and submit → should redirect to `/` (Dashboard stub)
3. Logout and go to `/login` → login with the same credentials → should redirect to `/`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat: login and register pages"
```

---

## Task 5: Dashboard Page + CalorieRing + MacroBar Components

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/components/CalorieRing.tsx`
- Create: `frontend/src/components/MacroBar.tsx`

- [ ] **Step 1: Create frontend/src/components/CalorieRing.tsx**

```typescript
// frontend/src/components/CalorieRing.tsx
interface CalorieRingProps {
  eaten: number
  target: number
}

export default function CalorieRing({ eaten, target }: CalorieRingProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(eaten / target, 1)
  const dash = pct * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={pct >= 1 ? '#ef4444' : '#22c55e'}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="mt-2 text-center">
        <p className="text-2xl font-bold text-gray-900">{eaten}</p>
        <p className="text-sm text-gray-500">of {target} kcal</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/MacroBar.tsx**

```typescript
// frontend/src/components/MacroBar.tsx
interface MacroBarProps {
  protein: number
  carbs: number
  fat: number
}

export default function MacroBar({ protein, carbs, fat }: MacroBarProps) {
  const total = protein + carbs + fat || 1
  const segments = [
    { label: 'Protein', value: protein, color: 'bg-blue-500', pct: (protein / total) * 100 },
    { label: 'Carbs', value: carbs, color: 'bg-yellow-400', pct: (carbs / total) * 100 },
    { label: 'Fat', value: fat, color: 'bg-orange-400', pct: (fat / total) * 100 },
  ]

  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3">
        {segments.map((s) => (
          <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        {segments.map((s) => (
          <span key={s.label}>
            <span className={`inline-block w-2 h-2 rounded-full ${s.color} mr-1`} />
            {s.label} {s.value.toFixed(0)}g
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement frontend/src/pages/Dashboard.tsx**

```typescript
// frontend/src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns' // NOT installed - use manual date format
import { useAuth } from '../contexts/AuthContext'
import { getMealPlans, getMealPlan, getProgress } from '../lib/api'
import CalorieRing from '../components/CalorieRing'
import MacroBar from '../components/MacroBar'
import type { MealPlanEntry } from '../lib/types'

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function Dashboard() {
  const { user } = useAuth()
  const today = new Date()
  const todayStr = formatDate(today)
  const dayOfWeek = (today.getDay() + 6) % 7  // 0=Mon

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })

  // Find the plan whose week contains today
  const activePlan = plans.find((p) => {
    const start = new Date(p.week_start_date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return today >= start && today <= end
  })

  const { data: planDetail } = useQuery({
    queryKey: ['meal-plan', activePlan?.id],
    queryFn: () => getMealPlan(activePlan!.id),
    enabled: !!activePlan,
  })

  const todayEntries: MealPlanEntry[] = planDetail?.entries.filter((e) => e.day_of_week === dayOfWeek) ?? []

  // Calculate today's totals from entries (using calories_override or 0 for custom meals without recipe)
  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories_override ?? 0), 0)

  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good {today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name}!</h1>
        <p className="text-gray-500 text-sm mt-1">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calorie card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Today's Calories</h2>
          <CalorieRing eaten={todayCalories} target={user?.daily_calorie_target ?? 2000} />
        </div>

        {/* Macro card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Macros Today</h2>
          <MacroBar protein={0} carbs={0} fat={0} />
          <p className="text-xs text-gray-400 mt-3">Macro breakdown available when meals have recipe nutrition data.</p>
        </div>
      </div>

      {/* Today's meals */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Today's Meals</h2>
        {activePlan ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MEAL_TYPES.map((type) => {
              const entry = todayEntries.find((e) => e.meal_type === type)
              return (
                <div key={type} className="rounded-xl border p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{type}</p>
                  {entry ? (
                    <p className="text-sm font-medium text-gray-800">{entry.custom_meal_name ?? `Recipe #${entry.recipe_id}`}</p>
                  ) : (
                    <p className="text-sm text-gray-300 italic">Not planned</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No meal plan for this week. <a href="/meal-planner" className="text-brand-600 underline">Create one</a>.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify Dashboard renders**

Navigate to http://localhost:5173/ after logging in. Should show the calorie ring and today's meals section.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CalorieRing.tsx frontend/src/components/MacroBar.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: dashboard with calorie ring and macro bar"
```

---

## Task 6: Recipes Page + RecipeDetail Page

**Files:**
- Modify: `frontend/src/pages/Recipes.tsx`
- Modify: `frontend/src/pages/RecipeDetail.tsx`
- Create: `frontend/src/components/RecipeCard.tsx`

- [ ] **Step 1: Create frontend/src/components/RecipeCard.tsx**

```typescript
// frontend/src/components/RecipeCard.tsx
import { Trash2, Edit } from 'lucide-react'
import type { Recipe } from '../lib/types'

interface RecipeCardProps {
  recipe: Recipe
  onEdit: () => void
  onDelete: () => void
}

export default function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{recipe.name}</h3>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-brand-500 rounded"><Edit size={14} /></button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
        </div>
      </div>
      {recipe.description && <p className="text-xs text-gray-500 line-clamp-2">{recipe.description}</p>}
      <div className="flex gap-3 text-xs text-gray-500 mt-auto pt-2 border-t">
        <span>{recipe.calories} kcal</span>
        <span>P: {recipe.protein_g}g</span>
        <span>C: {recipe.carbs_g}g</span>
        <span>F: {recipe.fat_g}g</span>
      </div>
      {recipe.is_public && <span className="text-xs text-brand-600 font-medium">Public</span>}
    </div>
  )
}
```

- [ ] **Step 2: Implement frontend/src/pages/Recipes.tsx**

```typescript
// frontend/src/pages/Recipes.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { getRecipes, deleteRecipe } from '../lib/api'
import RecipeCard from '../components/RecipeCard'

export default function Recipes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', search],
    queryFn: () => getRecipes(search ? { search } : undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <button
          onClick={() => navigate('/recipes/new')}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          <Plus size={16} /> Add Recipe
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Search recipes…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-400 text-sm">No recipes found. Add your first recipe!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => navigate(`/recipes/${recipe.id}`)}
              onDelete={() => { if (confirm('Delete this recipe?')) deleteMutation.mutate(recipe.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Implement frontend/src/pages/RecipeDetail.tsx**

```typescript
// frontend/src/pages/RecipeDetail.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createRecipe, getRecipe, updateRecipe } from '../lib/api'
import type { IngredientItem } from '../lib/types'

const EMPTY_FORM = {
  name: '', description: '', prep_time_min: '', servings: '1',
  calories: '0', protein_g: '0', carbs_g: '0', fat_g: '0',
  instructions: '', is_public: false,
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = !id || id === 'new'

  const [form, setForm] = useState(EMPTY_FORM)
  const [ingredients, setIngredients] = useState<IngredientItem[]>([])
  const [error, setError] = useState('')

  const { data: recipe } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(Number(id)),
    enabled: !isNew,
  })

  useEffect(() => {
    if (recipe) {
      setForm({
        name: recipe.name, description: recipe.description ?? '', prep_time_min: String(recipe.prep_time_min ?? ''),
        servings: String(recipe.servings), calories: String(recipe.calories), protein_g: String(recipe.protein_g),
        carbs_g: String(recipe.carbs_g), fat_g: String(recipe.fat_g), instructions: recipe.instructions ?? '', is_public: recipe.is_public,
      })
      setIngredients(recipe.ingredients)
    }
  }, [recipe])

  const saveMutation = useMutation({
    mutationFn: (data: object) => isNew ? createRecipe(data) : updateRecipe(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate('/recipes')
    },
    onError: () => setError('Failed to save recipe'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    saveMutation.mutate({
      ...form,
      prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : null,
      servings: Number(form.servings),
      calories: Number(form.calories),
      protein_g: Number(form.protein_g),
      carbs_g: Number(form.carbs_g),
      fat_g: Number(form.fat_g),
      ingredients,
    })
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const addIngredient = () => setIngredients((i) => [...i, { name: '', quantity: undefined, unit: '' }])
  const removeIngredient = (idx: number) => setIngredients((i) => i.filter((_, j) => j !== idx))
  const setIngredient = (idx: number, field: keyof IngredientItem, value: string) =>
    setIngredients((prev) => prev.map((item, j) => j === idx ? { ...item, [field]: field === 'quantity' ? Number(value) || undefined : value } : item))

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recipes')} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Recipe' : 'Edit Recipe'}</h1>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={set('name')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={set('description')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep time (min)</label>
              <input type="number" min="0" value={form.prep_time_min} onChange={set('prep_time_min')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input type="number" min="1" value={form.servings} onChange={set('servings')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Nutrition (per serving)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as const).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace('_g', '').replace('_', ' ')}{key !== 'calories' ? ' (g)' : ' (kcal)'}</label>
                <input type="number" min="0" step="0.1" value={(form as any)[key]} onChange={set(key)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Ingredients</h2>
            <button type="button" onClick={addIngredient} className="text-brand-600 text-sm font-medium flex items-center gap-1 hover:text-brand-700">
              <Plus size={14} /> Add
            </button>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input placeholder="Name" value={ing.name} onChange={(e) => setIngredient(idx, 'name', e.target.value)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input placeholder="Qty" type="number" value={ing.quantity ?? ''} onChange={(e) => setIngredient(idx, 'quantity', e.target.value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input placeholder="Unit" value={ing.unit ?? ''} onChange={(e) => setIngredient(idx, 'unit', e.target.value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button type="button" onClick={() => removeIngredient(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Instructions</h2>
          <textarea rows={4} value={form.instructions} onChange={set('instructions')} placeholder="Step-by-step instructions…" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={set('is_public')} className="rounded text-brand-500" />
            <span className="text-sm text-gray-700">Make this recipe public (visible to all family members)</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium text-sm hover:bg-brand-600 disabled:opacity-60">
            {saveMutation.isPending ? 'Saving…' : isNew ? 'Create Recipe' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/recipes')} className="px-6 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Test recipes flow manually**

1. Go to /recipes → click Add Recipe → fill in form → submit
2. Verify recipe appears in the list
3. Click Edit → change name → save
4. Click Delete → confirm → recipe is removed

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/RecipeCard.tsx frontend/src/pages/Recipes.tsx frontend/src/pages/RecipeDetail.tsx
git commit -m "feat: recipes list and recipe create/edit pages"
```

---

## Task 7: Meal Planner Page

**Files:**
- Modify: `frontend/src/pages/MealPlanner.tsx`
- Create: `frontend/src/components/WeekGrid.tsx`
- Create: `frontend/src/components/MealSlot.tsx`

- [ ] **Step 1: Create frontend/src/components/MealSlot.tsx**

```typescript
// frontend/src/components/MealSlot.tsx
import { Plus, X } from 'lucide-react'
import type { MealPlanEntry, Recipe } from '../lib/types'

interface MealSlotProps {
  entry: MealPlanEntry | undefined
  recipe: Recipe | undefined
  onAdd: () => void
  onRemove: () => void
}

export default function MealSlot({ entry, recipe, onAdd, onRemove }: MealSlotProps) {
  if (!entry) {
    return (
      <button
        onClick={onAdd}
        className="w-full h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-brand-400 hover:text-brand-400 transition-colors"
      >
        <Plus size={16} />
      </button>
    )
  }

  const label = recipe?.name ?? entry.custom_meal_name ?? 'Custom meal'
  const cals = entry.calories_override ?? recipe?.calories ?? 0

  return (
    <div className="relative w-full h-16 rounded-lg bg-brand-50 border border-brand-200 p-2 flex flex-col justify-between">
      <p className="text-xs font-medium text-brand-800 line-clamp-2 leading-tight">{label}</p>
      {cals > 0 && <p className="text-xs text-brand-500">{cals} kcal</p>}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-0.5 text-brand-300 hover:text-red-500"
      >
        <X size={12} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Implement frontend/src/pages/MealPlanner.tsx**

```typescript
// frontend/src/pages/MealPlanner.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from 'lucide-react'
import {
  getMealPlans, getMealPlan, createMealPlan, addMealPlanEntry,
  deleteMealPlanEntry, getRecipes, generateShoppingList,
} from '../lib/api'
import MealSlot from '../components/MealSlot'
import type { Recipe } from '../lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function MealPlanner() {
  const queryClient = useQueryClient()
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [showAddModal, setShowAddModal] = useState<{ day: number; type: string } | null>(null)
  const weekStartStr = formatDate(weekStart)

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })
  const activePlan = plans.find((p) => p.week_start_date === weekStartStr)

  const { data: planDetail } = useQuery({
    queryKey: ['meal-plan', activePlan?.id],
    queryFn: () => getMealPlan(activePlan!.id),
    enabled: !!activePlan,
  })

  const { data: recipes = [] } = useQuery({ queryKey: ['recipes'], queryFn: getRecipes })

  const createPlanMutation = useMutation({
    mutationFn: () => createMealPlan({ week_start_date: weekStartStr, name: `Week of ${weekStartStr}` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plans'] }),
  })

  const addEntryMutation = useMutation({
    mutationFn: ({ recipeId, customName }: { recipeId?: number; customName?: string }) =>
      addMealPlanEntry(activePlan!.id, {
        day_of_week: showAddModal!.day,
        meal_type: showAddModal!.type,
        recipe_id: recipeId ?? null,
        custom_meal_name: customName ?? null,
        servings: 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', activePlan?.id] })
      setShowAddModal(null)
    },
  })

  const removeEntryMutation = useMutation({
    mutationFn: (entryId: number) => deleteMealPlanEntry(activePlan!.id, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan', activePlan?.id] }),
  })

  const generateListMutation = useMutation({
    mutationFn: () => generateShoppingList(activePlan!.id),
    onSuccess: () => alert('Shopping list generated! Check the Shopping List page.'),
  })

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  const getEntry = (day: number, type: string) =>
    planDetail?.entries.find((e) => e.day_of_week === day && e.meal_type === type)

  const getRecipe = (recipeId: number | null) =>
    recipeId ? recipes.find((r: Recipe) => r.id === recipeId) : undefined

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">Week of {weekStartStr}</span>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronRight size={18} /></button>
        </div>
        {activePlan && (
          <button
            onClick={() => generateListMutation.mutate()}
            disabled={generateListMutation.isPending}
            className="flex items-center gap-2 bg-brand-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
          >
            <ShoppingCart size={14} /> Generate Shopping List
          </button>
        )}
      </div>

      {/* Create plan prompt */}
      {!activePlan && (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-gray-500 mb-4">No meal plan for this week.</p>
          <button
            onClick={() => createPlanMutation.mutate()}
            disabled={createPlanMutation.isPending}
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            <Plus size={16} /> Create Plan for This Week
          </button>
        </div>
      )}

      {/* Grid */}
      {activePlan && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="w-24 text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-2">Meal</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center text-xs font-semibold text-gray-500 uppercase pb-3 px-1">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-2">
              {MEAL_TYPES.map((type) => (
                <tr key={type}>
                  <td className="pr-2 text-xs font-semibold text-gray-500 capitalize align-top pt-1">{type}</td>
                  {DAYS.map((_, day) => {
                    const entry = getEntry(day, type)
                    return (
                      <td key={day} className="px-1 pb-2">
                        <MealSlot
                          entry={entry}
                          recipe={getRecipe(entry?.recipe_id ?? null)}
                          onAdd={() => setShowAddModal({ day, type })}
                          onRemove={() => entry && removeEntryMutation.mutate(entry.id)}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add meal modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Add {showAddModal.type} on {DAYS[showAddModal.day]}</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recipes.map((r: Recipe) => (
                <button
                  key={r.id}
                  onClick={() => addEntryMutation.mutate({ recipeId: r.id })}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-50 text-sm"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-gray-400 ml-2">{r.calories} kcal</span>
                </button>
              ))}
              {recipes.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No recipes. Add some first.</p>}
            </div>
            <button onClick={() => setShowAddModal(null)} className="w-full border rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Test meal planner manually**

1. Go to /meal-planner → click "Create Plan for This Week"
2. Click a meal slot → select a recipe
3. Verify it appears in the slot
4. Click the X to remove it
5. Click "Generate Shopping List" and verify it navigates

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/MealSlot.tsx frontend/src/components/WeekGrid.tsx frontend/src/pages/MealPlanner.tsx
git commit -m "feat: meal planner with weekly grid and slot management"
```

---

## Task 8: Shopping List, Progress, AI Suggestions, Profile Pages

**Files:**
- Modify: `frontend/src/pages/ShoppingList.tsx`
- Modify: `frontend/src/pages/Progress.tsx`
- Modify: `frontend/src/pages/AISuggestions.tsx`
- Modify: `frontend/src/pages/Profile.tsx`
- Create: `frontend/src/components/ChatMessage.tsx`

- [ ] **Step 1: Implement frontend/src/pages/ShoppingList.tsx**

```typescript
// frontend/src/pages/ShoppingList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMealPlans, getShoppingList, updateShoppingItem, addShoppingItem, generateShoppingList } from '../lib/api'
import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import type { ShoppingListItem } from '../lib/types'

export default function ShoppingList() {
  const queryClient = useQueryClient()
  const [newItem, setNewItem] = useState('')

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })
  const latestPlan = plans.sort((a, b) => b.id - a.id)[0]

  const { data: list, isLoading } = useQuery({
    queryKey: ['shopping-list', latestPlan?.id],
    queryFn: async () => {
      // Try to find existing list or create one
      try {
        return await generateShoppingList(latestPlan!.id)
      } catch {
        return null
      }
    },
    enabled: !!latestPlan,
    staleTime: Infinity,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: number; checked: boolean }) =>
      updateShoppingItem(list!.id, itemId, { is_checked: checked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', latestPlan?.id] }),
  })

  const addMutation = useMutation({
    mutationFn: () => addShoppingItem(list!.id, { ingredient_name: newItem, category: 'other' }),
    onSuccess: () => {
      setNewItem('')
      queryClient.invalidateQueries({ queryKey: ['shopping-list', latestPlan?.id] })
    },
  })

  const categories = ['produce', 'meat', 'dairy', 'grains', 'other']

  const grouped = categories.reduce((acc, cat) => {
    const items = list?.items.filter((i: ShoppingListItem) => i.category === cat) ?? []
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, ShoppingListItem[]>)

  if (!latestPlan) return <div className="p-6 text-gray-400">Create a meal plan first to generate a shopping list.</div>
  if (isLoading) return <div className="p-6 text-gray-400">Loading…</div>

  const checked = list?.items.filter((i: ShoppingListItem) => i.is_checked).length ?? 0
  const total = list?.items.length ?? 0

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
        {total > 0 && <span className="text-sm text-gray-500">{checked}/{total} checked</span>}
      </div>

      {list && (
        <>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-2xl border p-4 space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide capitalize">{cat}</h2>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMutation.mutate({ itemId: item.id, checked: !item.is_checked })}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.is_checked ? 'bg-brand-500 border-brand-500' : 'border-gray-300 hover:border-brand-400'}`}
                  >
                    {item.is_checked && <Check size={12} className="text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.ingredient_name}
                    {item.quantity && <span className="text-gray-400 ml-1">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={newItem} onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add item manually…"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => e.key === 'Enter' && newItem.trim() && addMutation.mutate()}
            />
            <button
              onClick={() => newItem.trim() && addMutation.mutate()}
              disabled={!newItem.trim()}
              className="bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60"
            >
              <Plus size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implement frontend/src/pages/Progress.tsx**

```typescript
// frontend/src/pages/Progress.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getProgress, logProgress, deleteProgress } from '../lib/api'
import { Trash2 } from 'lucide-react'

export default function Progress() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ logged_at: new Date().toISOString().split('T')[0], weight_kg: '', body_fat_pct: '', notes: '' })
  const [error, setError] = useState('')

  const { data: logs = [] } = useQuery({ queryKey: ['progress'], queryFn: getProgress })

  const logMutation = useMutation({
    mutationFn: () => logProgress({
      logged_at: form.logged_at,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
      notes: form.notes || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      setForm((f) => ({ ...f, weight_kg: '', body_fat_pct: '', notes: '' }))
      setError('')
    },
    onError: () => setError('Already logged for this date or an error occurred.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProgress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress'] }),
  })

  const chartData = [...logs]
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    .filter((l) => l.weight_kg)
    .map((l) => ({ date: l.logged_at, weight: l.weight_kg }))

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>

      {/* Log form */}
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Log Today</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.logged_at} onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" placeholder="75.0" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body fat %</label>
            <input type="number" step="0.1" placeholder="18.0" value={form.body_fat_pct} onChange={(e) => setForm((f) => ({ ...f, body_fat_pct: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" placeholder="Optional…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <button onClick={() => logMutation.mutate()} disabled={logMutation.isPending}
          className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
          {logMutation.isPending ? 'Saving…' : 'Log Progress'}
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Weight Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log table */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Weight</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Body Fat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...logs].sort((a, b) => b.logged_at.localeCompare(a.logged_at)).map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{log.logged_at}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{log.weight_kg ? `${log.weight_kg} kg` : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{log.body_fat_pct ? `${log.body_fat_pct}%` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{log.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteMutation.mutate(log.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/ChatMessage.tsx**

```typescript
// frontend/src/components/ChatMessage.tsx
interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function ChatMessage({ role, content, streaming }: ChatMessageProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
        role === 'user' ? 'bg-brand-500 text-white' : 'bg-white border text-gray-800'
      }`}>
        <p className="whitespace-pre-wrap leading-relaxed">{content}{streaming && <span className="animate-pulse">▋</span>}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement frontend/src/pages/AISuggestions.tsx**

```typescript
// frontend/src/pages/AISuggestions.tsx
import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ChatMessage from '../components/ChatMessage'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AISuggestions() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi ${user?.name ?? 'there'}! I can suggest meals based on your ${user?.goal ?? 'health'} goal and ${user?.daily_calorie_target ?? 2000} kcal/day target. Try asking: "Suggest a full day of meals" or "What's a good high-protein breakfast?"` }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMessage = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userMessage }])
    setStreaming(true)
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          context: {
            goal: user?.goal ?? 'maintain',
            daily_calorie_target: user?.daily_calorie_target ?? 2000,
            restrictions: [],
          },
        }),
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const token = line.slice(6)
          if (token === '[DONE]') { setStreaming(false); return }
          setMessages((m) => {
            const last = m[m.length - 1]
            return [...m.slice(0, -1), { ...last, content: last.content + token }]
          })
        }
      }
    } catch {
      setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content: 'Sorry, something went wrong. Make sure Ollama is running.' }])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900">AI Meal Suggestions</h1>
        <p className="text-sm text-gray-500 mt-1">Powered by Ollama (local AI — private & free)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask for meal suggestions…"
            disabled={streaming}
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="bg-brand-500 text-white p-2.5 rounded-xl hover:bg-brand-600 disabled:opacity-60"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement frontend/src/pages/Profile.tsx**

```typescript
// frontend/src/pages/Profile.tsx
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { updateMe } from '../lib/api'

export default function Profile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    goal: 'maintain', activity_level: 'moderate',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        age: user.age ? String(user.age) : '',
        gender: user.gender ?? '',
        height_cm: user.height_cm ? String(user.height_cm) : '',
        weight_kg: user.weight_kg ? String(user.weight_kg) : '',
        goal: user.goal,
        activity_level: user.activity_level,
      })
    }
  }, [user])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const saveMutation = useMutation({
    mutationFn: () => updateMe({
      name: form.name,
      age: form.age ? Number(form.age) : null,
      gender: form.gender || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      goal: form.goal,
      activity_level: form.activity_level,
    }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      {saved && <p className="text-sm text-brand-600 bg-brand-50 rounded-lg px-3 py-2">Profile saved!</p>}

      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={form.name} onChange={set('name')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <p className="text-sm text-gray-500">Email: {user?.email}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input type="number" value={form.age} onChange={set('age')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select value={form.gender} onChange={set('gender')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input type="number" value={form.height_cm} onChange={set('height_cm')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" value={form.weight_kg} onChange={set('weight_kg')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
          <select value={form.goal} onChange={set('goal')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain weight</option>
            <option value="gain">Gain weight</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity level</label>
          <select value={form.activity_level} onChange={set('activity_level')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly active</option>
            <option value="moderate">Moderately active</option>
            <option value="active">Active</option>
            <option value="very_active">Very active</option>
          </select>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-500">Calorie target: <strong className="text-brand-600">{user?.daily_calorie_target} kcal/day</strong> (recalculated on save)</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-brand-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Test all four pages manually**

1. Shopping List: Go to /shopping-list — verify items appear, check/uncheck works, manual add works
2. Progress: Go to /progress — log an entry, verify chart appears after 2+ entries
3. AI Suggestions: Go to /ai — send a message, verify streaming response appears (requires Ollama running with llama3.2)
4. Profile: Go to /profile — update weight, save, verify calorie target updates

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ShoppingList.tsx frontend/src/pages/Progress.tsx frontend/src/pages/AISuggestions.tsx frontend/src/pages/Profile.tsx frontend/src/components/ChatMessage.tsx
git commit -m "feat: shopping list, progress, AI chat, and profile pages"
```

---

## Task 9: Production Build + Docker Compose Full Stack

**Files:**
- No new files — verify existing docker-compose.yml and Dockerfile work together

- [ ] **Step 1: Build the frontend production image**

```bash
cd frontend
npm run build
```

Expected: `dist/` folder created, no TypeScript errors

- [ ] **Step 2: Start full stack with Docker Compose**

```bash
cd "C:/Users/moham/Documents/Diet Planner"
docker compose up --build -d
```

Expected: all 4 containers start (`frontend`, `backend`, `db`, `ollama`)

- [ ] **Step 3: Smoke test the full stack**

Open http://localhost in a browser.

- [ ] **Step 4: Register a new user and walk through all features**

1. Register with full profile
2. Add 3 recipes
3. Create a meal plan for this week, assign recipes to slots
4. Generate shopping list, check off items
5. Log progress with weight
6. Ask the AI for meal suggestions (requires Ollama to have finished pulling llama3.2)

- [ ] **Step 5: Test on mobile browser**

Open http://localhost on your phone (use your server's LAN IP instead of localhost).
Verify:
- Sidebar collapses to hamburger menu
- Meal planner grid is horizontally scrollable
- All forms are usable on touch

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: production-ready full-stack diet planner app"
```

---

## Self-Review Notes

- All 6 features from spec are implemented: Dashboard, Meal Planner, Recipes, Shopping List, Progress, AI Suggestions
- Auth flow: register → cookie set → protected routes guard → logout clears query cache
- SSE streaming uses native `fetch` + `ReadableStream` (not axios, which doesn't support streaming)
- Mobile responsive: Layout uses hamburger on small screens; meal grid uses horizontal scroll
- Proxy in vite.config.ts forwards API calls to backend in dev; nginx does the same in production
- AI page includes error message if Ollama is not running
- Dashboard calorie ring turns red when over target
