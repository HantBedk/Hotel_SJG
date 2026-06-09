import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  setAuth: (user: AuthUser, token: string) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
  setBootstrapping: (value: boolean) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isBootstrapping: true,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),

      setBootstrapping: (value) => set({ isBootstrapping: value }),

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
    }),
    {
      name: 'hotel-sjg-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
