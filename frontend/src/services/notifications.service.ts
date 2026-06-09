import api from '@/lib/axios'
import type { AppNotification } from '@/types'

export const getNotificationsApi = async (): Promise<{
  data: AppNotification[]
  meta: unknown
}> => {
  const res = await api.get('/notifications')
  return res.data.data
}

export const getUnreadCountApi = async (): Promise<number> => {
  const res = await api.get('/notifications/unread-count')
  return res.data.data.count
}

export const markReadApi = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`)
}

export const markAllReadApi = async (): Promise<void> => {
  await api.post('/notifications/read-all')
}
