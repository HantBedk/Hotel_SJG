import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import toast from 'react-hot-toast'
import {
  getNotificationsApi,
  getUnreadCountApi,
  markReadApi,
  markAllReadApi,
} from '@/services/notifications.service'

export function useNotifications() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: hotelQueryKey('notifications'),
    queryFn: getNotificationsApi,
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: hotelQueryKey('notifications-unread'),
    queryFn: getUnreadCountApi,
    refetchInterval: 60_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelQueryKey('notifications') })
      qc.invalidateQueries({ queryKey: hotelQueryKey('notifications-unread') })
    },
    onError: () => toast.error('Error al marcar notificación.'),
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelQueryKey('notifications') })
      qc.invalidateQueries({ queryKey: hotelQueryKey('notifications-unread') })
    },
    onError: () => toast.error('Error al marcar todas.'),
  })

  return {
    notifications: data?.data ?? [],
    isLoading,
    unreadCount,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  }
}
