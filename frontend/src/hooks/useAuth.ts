import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginPayload, LoginResponse, ApiResponse } from '@/types'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user, hasPermission, hasRole } =
    useAuthStore()

  const login = async (payload: LoginPayload) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/login', payload)
    if (data.success && data.data) {
      setAuth(data.data.token, data.data.user)
    }
    return data
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } finally {
      clearAuth()
    }
  }

  return { login, logout, isAuthenticated, user, hasPermission, hasRole }
}
