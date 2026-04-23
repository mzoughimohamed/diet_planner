import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, logout as apiLogout } from '../lib/api'
import type { User } from '../lib/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isError: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true, isError: false, logout: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user = null, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: Infinity,
  })

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      queryClient.clear()
      window.location.href = '/login'
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, isError, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
