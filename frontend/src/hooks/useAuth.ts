import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useHotelStore } from '@/store/hotelStore'
import { loginApi, logoutApi, getMeApi } from '@/services/auth.service'
import { disconnectEcho } from '@/hooks/useReverb'
import type { LoginPayload } from '@/types'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user, hasPermission, hasAnyPermission, hasRole } = useAuthStore()
  const queryClient = useQueryClient()

  const login = async (payload: LoginPayload) => {
    const res = await loginApi(payload)
    if (res.success && res.data) {
      setAuth(res.data.user, res.data.token)
      useHotelStore.getState().setFromAuth({
        hotels:            res.data.user.hotels ?? [],
        can_switch_hotel:  res.data.user.can_switch_hotel ?? false,
        current_hotel_id:  res.data.user.current_hotel_id,
      })
    }
    return res
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      disconnectEcho()
      useHotelStore.getState().reset()
      clearAuth()
      // El cache de React Query guarda datos del usuario anterior (logs,
      // dashboard, etc.). Si no se limpia, al iniciar sesión otro rol los
      // componentes pueden mostrar/refetchear datos a los que el nuevo rol
      // no tiene permiso y disparar 403/CORS innecesarios.
      queryClient.clear()
    }
  }

  return { login, logout, isAuthenticated, user, hasPermission, hasAnyPermission, hasRole }
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
        if (res.success && res.data) {
          setUser(res.data)
          useHotelStore.getState().setFromAuth({
            hotels:            res.data.hotels ?? [],
            can_switch_hotel:  res.data.can_switch_hotel ?? false,
            current_hotel_id:  res.data.current_hotel_id,
          })
        } else clearAuth()
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
