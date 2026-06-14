import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { loginApi, logoutApi, getMeApi } from '@/services/auth.service'
import { disconnectEcho } from '@/hooks/useReverb'
import type { LoginPayload } from '@/types'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user, hasPermission, hasRole } = useAuthStore()
  const queryClient = useQueryClient()

  const login = async (payload: LoginPayload) => {
    const res = await loginApi(payload)
    if (res.success && res.data) {
      setAuth(res.data.user, res.data.token)
    }
    return res
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      disconnectEcho()
      clearAuth()
      // El cache de React Query guarda datos del usuario anterior (logs,
      // dashboard, etc.). Si no se limpia, al iniciar sesión otro rol los
      // componentes pueden mostrar/refetchear datos a los que el nuevo rol
      // no tiene permiso y disparar 403/CORS innecesarios.
      queryClient.clear()
    }
  }

  return { login, logout, isAuthenticated, user, hasPermission, hasRole }
}

// On app mount: if a token exists in the store, validate it via /me.
// If no token or /me returns 401, clear auth so the router shows /login.
export function useAuthBootstrap() {
  const isBootstrapping   = useAuthStore((s) => s.isBootstrapping)
  const token             = useAuthStore((s) => s.token)
  const setUser           = useAuthStore((s) => s.setUser)
  const clearAuth         = useAuthStore((s) => s.clearAuth)
  const setBootstrapping  = useAuthStore((s) => s.setBootstrapping)

  useEffect(() => {
    let cancelled = false

    if (!token) {
      clearAuth()
      setBootstrapping(false)
      return
    }

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
