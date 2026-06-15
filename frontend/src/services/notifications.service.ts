import api from '@/lib/axios'
import type { ApiResponse, AppNotification } from '@/types'

export interface NotificationsListResult {
  data: AppNotification[]
  meta: unknown
}

export interface UnreadCountResult {
  count: number
}

export async function getNotificationsApi(): Promise<NotificationsListResult> {
  const { data } = await api.get<ApiResponse<NotificationsListResult>>('/notifications')
  return data.data
}

export async function getUnreadCountApi(): Promise<number> {
  const { data } = await api.get<ApiResponse<UnreadCountResult>>('/notifications/unread-count')
  return data.data.count
}

export async function markReadApi(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`)
}

export async function markAllReadApi(): Promise<void> {
  await api.post('/notifications/read-all')
}
