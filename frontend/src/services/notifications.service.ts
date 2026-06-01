import api from '@/lib/axios'
import type { AppNotification } from '@/types'

export const getNotificationsApi = async (): Promise<{
  data: AppNotification[]
  meta: unknown
}> => {
  const res = await api.get('/v1/notifications')
  return res.data.data
}

export const getUnreadCountApi = async (): Promise<number> => {
  const res = await api.get('/v1/notifications/unread-count')
  return res.data.data.count
}

export const markReadApi = async (id: string): Promise<void> => {
  await api.post(`/v1/notifications/${id}/read`)
}

export const markAllReadApi = async (): Promise<void> => {
  await api.post('/v1/notifications/read-all')
}
