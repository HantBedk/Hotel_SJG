import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { useHotelStore } from '@/store/hotelStore'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
  withCredentials: true,
  withXSRFToken: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const hotelId = useHotelStore.getState().currentHotelId
  if (hotelId) {
    config.headers['X-Hotel-Id'] = hotelId
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url    = (error.config?.url ?? '') as string

    if (status === 401 && !url.endsWith('/me')) {
      useAuthStore.getState().clearAuth()
      if (globalThis.location.pathname !== '/login') {
        globalThis.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
