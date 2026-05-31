import { create } from 'zustand'
import type { AuthUser } from '@/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

// Token lives ONLY in Zustand memory — never localStorage, never sessionStorage
export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

  clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),

  hasPermission: (permission) => {
    const { user } = get()
    if (!user) return false
    if (user.roles.includes('superadmin')) return true
    return user.permissions.includes(permission)
  },

  hasRole: (role) => {
    const { user } = get()
    if (!user) return false
    return user.roles.includes(role)
  },
}))
