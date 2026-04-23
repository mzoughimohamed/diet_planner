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
