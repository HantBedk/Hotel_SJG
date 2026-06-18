import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHotelQueryKey } from '@/lib/hotelQueryKey'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import {
  getNotificationsApi,
  getUnreadCountApi,
  markReadApi,
  markAllReadApi,
} from '@/services/notifications.service'

export function useNotifications() {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const notificationsKey = useHotelQueryKey('notifications')
  const unreadKey = useHotelQueryKey('notifications-unread')

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: notificationsKey,
    queryFn: getNotificationsApi,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: unreadKey,
    queryFn: getUnreadCountApi,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsKey })
      qc.invalidateQueries({ queryKey: unreadKey })
    },
    onError: () => toast.error('Error al marcar notificación.'),
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsKey })
      qc.invalidateQueries({ queryKey: unreadKey })
    },
    onError: () => toast.error('Error al marcar todas.'),
  })

  return {
    notifications,
    isLoading,
    unreadCount,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  }
}
