import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

// ── Request: inject Bearer token ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: handle 401 / 403 ───────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
