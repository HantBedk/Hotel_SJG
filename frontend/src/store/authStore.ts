import { create } from 'zustand'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  setUser: (user: AuthUser) => void
  clearAuth: () => void
  setBootstrapping: (value: boolean) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

// Sanctum SPA mode: the auth session lives in an httpOnly cookie set by the
// backend. This store only keeps the hydrated user identity in memory — no
// token, no localStorage. On full reload, AuthBootstrap re-fetches /me using
// the cookie to repopulate the store.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearAuth: () => set({ user: null, isAuthenticated: false }),

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
}))
