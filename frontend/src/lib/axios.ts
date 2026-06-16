import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { useHotelStore } from '@/store/hotelStore'
import { isHotelAccessDeniedMessage, shouldAttachHotelHeader } from '@/lib/tenantHeader'

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

function syncHotelFromAuthUser(): void {
  const user = useAuthStore.getState().user
  if (! user) return

  useHotelStore.getState().setFromAuth({
    hotels:           user.hotels ?? [],
    can_switch_hotel: user.can_switch_hotel ?? false,
    current_hotel_id: user.current_hotel_id ?? null,
  })
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const hotelId = useHotelStore.getState().currentHotelId
  if (hotelId && shouldAttachHotelHeader(config.url)) {
    config.headers['X-Hotel-Id'] = hotelId
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const url    = (error.config?.url ?? '') as string
    const message = error.response?.data?.message

    if (status === 403 && isHotelAccessDeniedMessage(message)) {
      syncHotelFromAuthUser()

      const config = error.config
      if (config && ! ('__hotelRetry' in config && config.__hotelRetry)) {
        config.__hotelRetry = true
        const hotelId = useHotelStore.getState().currentHotelId
        if (hotelId) {
          config.headers['X-Hotel-Id'] = hotelId
        } else {
          delete config.headers['X-Hotel-Id']
        }
        return api.request(config)
      }
    }

    if (status === 401 && ! url.endsWith('/me')) {
      useAuthStore.getState().clearAuth()
      if (globalThis.location.pathname !== '/login') {
        globalThis.location.href = '/login'
      }
    }

    throw error
  },
)

export default api
