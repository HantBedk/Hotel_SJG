import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'
import { useHotelStore } from '@/store/hotelStore'

const AUTH_STORAGE_KEY = 'hotel-sjg-auth'
const SUPERADMIN_ROLE = 'superadmin'

interface AuthPersistedState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(
      (item): item is string => typeof item === 'string',
    )
  }
  return []
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    ...user,
    roles: normalizeStringList(user.roles),
    permissions: normalizeStringList(user.permissions),
    hotels: Array.isArray(user.hotels) ? user.hotels : [],
  }
}

interface AuthState extends AuthPersistedState {
  isBootstrapping: boolean
  setAuth: (user: AuthUser, token: string) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
  setBootstrapping: (value: boolean) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: readonly string[]) => boolean
  hasAnyRole: (roles: readonly string[]) => boolean
  hasRole: (role: string) => boolean
}

function userHasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false
  if (user.roles.includes(SUPERADMIN_ROLE)) return true
  return user.permissions.includes(permission)
}

function userHasAnyPermission(user: AuthUser | null, permissions: readonly string[]): boolean {
  return permissions.some((permission) => userHasPermission(user, permission))
}

function userHasAnyRole(user: AuthUser | null, roles: readonly string[]): boolean {
  if (!user) return false
  return roles.some((role) => user.roles.includes(role))
}

function userHasRole(user: AuthUser | null, role: string): boolean {
  if (!user) return false
  return user.roles.includes(role)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isBootstrapping: true,

      setAuth: (user, token) => set({ user: normalizeAuthUser(user), token, isAuthenticated: true }),

      setUser: (user) => set({ user: normalizeAuthUser(user), isAuthenticated: true }),

      clearAuth: () => {
        useHotelStore.getState().reset()
        set({ user: null, token: null, isAuthenticated: false })
      },

      setBootstrapping: (value) => set({ isBootstrapping: value }),

      hasPermission: (permission) => userHasPermission(get().user, permission),

      hasAnyPermission: (permissions) => userHasAnyPermission(get().user, permissions),

      hasAnyRole: (roles) => userHasAnyRole(get().user, roles),

      hasRole: (role) => userHasRole(get().user, role),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state): AuthPersistedState => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
