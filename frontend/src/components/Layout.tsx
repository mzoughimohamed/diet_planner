import type { ReactNode } from 'react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, CalendarDays, UtensilsCrossed, ShoppingCart,
  TrendingUp, Bot, User, Menu, LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meal-planner', icon: CalendarDays, label: 'Meal Planner' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/ai', icon: Bot, label: 'AI Suggestions' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'
  }`

interface SidebarContentProps {
  userName: string | undefined
  onNavClick: () => void
  onLogout: () => void
}

const SidebarContent = ({ userName, onNavClick, onLogout }: SidebarContentProps) => (
  <nav className="flex flex-col h-full">
    <div className="p-6 border-b">
      <h1 className="text-xl font-bold text-brand-600">Diet Planner</h1>
      <p className="text-sm text-gray-500 mt-1">{userName}</p>
    </div>
    <div className="flex-1 p-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} className={navLinkClass} onClick={onNavClick}>
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </div>
    <div className="p-4 border-t space-y-1">
      <NavLink to="/profile" className={navLinkClass} onClick={onNavClick}>
        <User size={18} />
        Profile
      </NavLink>
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  </nav>
)

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r flex-col flex-shrink-0">
        <SidebarContent userName={user?.name} onNavClick={() => {}} onLogout={logout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-64 bg-white flex flex-col">
            <SidebarContent userName={user?.name} onNavClick={() => setSidebarOpen(false)} onLogout={logout} />
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
