import api from '@/lib/axios'
import type { ApiResponse, AppNotification } from '@/types'

interface PaginatedNotifications {
  data: AppNotification[]
}

export interface UnreadCountResult {
  count: number
}

export async function getNotificationsApi(): Promise<AppNotification[]> {
  const { data } = await api.get<ApiResponse<PaginatedNotifications>>('/notifications', {
    params: { per_page: 50 },
  })

  const page = data.data
  return Array.isArray(page) ? page : page?.data ?? []
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
