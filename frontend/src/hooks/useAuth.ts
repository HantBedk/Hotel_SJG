import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { loginApi, logoutApi, getMeApi } from '@/services/auth.service'
import { disconnectEcho } from '@/hooks/useReverb'
import type { LoginPayload } from '@/types'

export function useAuth() {
  const { setUser, clearAuth, isAuthenticated, user, hasPermission, hasRole } = useAuthStore()

  const login = async (payload: LoginPayload) => {
    const res = await loginApi(payload)
    if (res.success && res.data) {
      setUser(res.data.user)
    }
    return res
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      disconnectEcho()
      clearAuth()
    }
  }

  return { login, logout, isAuthenticated, user, hasPermission, hasRole }
}

// Runs once on app mount: probes /me with the session cookie. If the user
// already has a valid session, the store is rehydrated; otherwise we land
// unauthenticated and the router shows /login.
export function useAuthBootstrap() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const setUser         = useAuthStore((s) => s.setUser)
  const clearAuth       = useAuthStore((s) => s.clearAuth)
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getMeApi()
        if (cancelled) return
        if (res.success && res.data) setUser(res.data)
        else clearAuth()
      } catch {
        if (!cancelled) clearAuth()
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isBootstrapping }
}
