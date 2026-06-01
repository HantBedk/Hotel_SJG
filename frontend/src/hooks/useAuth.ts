import { useAuthStore } from '@/store/authStore'
import { loginApi, logoutApi } from '@/services/auth.service'
import type { LoginPayload } from '@/types'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user, hasPermission, hasRole } = useAuthStore()

  const login = async (payload: LoginPayload) => {
    const res = await loginApi(payload)
    if (res.success && res.data) {
      setAuth(res.data.token, res.data.user)
    }
    return res
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      clearAuth()
    }
  }

  return { login, logout, isAuthenticated, user, hasPermission, hasRole }
}
