import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getRoomsApi, getRoomTypesApi, createRoomApi,
  updateRoomApi, updateRoomStatusApi, deleteRoomApi,
  getHousekeepersApi,
} from '@/services/rooms.service'
import type { Room, RoomStatus } from '@/types'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import { extractApiError } from '@/lib/apiError'

export function useRooms(statusFilter?: RoomStatus) {
  const queryClient = useQueryClient()

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: hotelQueryKey('rooms', statusFilter),
    queryFn:  () => getRoomsApi(statusFilter),
  })

  const { data: roomTypes = [] } = useQuery({
    queryKey: hotelQueryKey('room-types'),
    queryFn:  getRoomTypesApi,
    staleTime: Infinity,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('rooms') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('dashboard') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications-unread') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('activity-logs') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('admin', 'rooms') })
  }

  const createMutation = useMutation({
    mutationFn: createRoomApi,
    onSuccess: () => { toast.success('Habitación creada.'); invalidate() },
    onError:   () => toast.error('Error al crear habitación.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateRoomApi>[1] }) =>
      updateRoomApi(id, payload),
    onSuccess: () => { toast.success('Habitación actualizada.'); invalidate() },
    onError:   () => toast.error('Error al actualizar.'),
  })

  const patchRoomInCache = (room: Room) => {
    queryClient.setQueriesData<Room[]>(
      { queryKey: hotelQueryKey('rooms') },
      (prev) => prev?.map((r) => (r.id === room.id ? { ...r, ...room } : r)) ?? [],
    )
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: RoomStatus; notes?: string }) =>
      updateRoomStatusApi(id, { status, notes }),
    onSuccess: (room) => {
      toast.success('Estado actualizado.')
      patchRoomInCache(room)
      invalidate()
    },
    onError:   (e) => toast.error(extractApiError(e, 'Error al cambiar estado.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoomApi,
    onSuccess: () => { toast.success('Habitación desactivada.'); invalidate() },
    onError:   () => toast.error('Error al desactivar.'),
  })

  // Sync room when Reverb broadcasts a status change
  const syncRoomStatus = (roomId: string, status: RoomStatus) => {
    queryClient.setQueriesData<Room[]>(
      { queryKey: hotelQueryKey('rooms') },
      (prev) => prev?.map((r) => (r.id === roomId ? { ...r, status } : r)) ?? [],
    )
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('dashboard') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications-unread') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('repair-orders') })
  }

  return {
    rooms,
    roomTypes,
    isLoading,
    createRoom:        createMutation.mutate,
    updateRoom:        updateMutation.mutate,
    changeStatus:      statusMutation.mutate,
    changeStatusAsync: statusMutation.mutateAsync,
    deleteRoom:        deleteMutation.mutate,
    isCreating:        createMutation.isPending,
    isUpdating:        updateMutation.isPending,
    isChanging:        statusMutation.isPending,
    isDeleting:        deleteMutation.isPending,
    syncRoomStatus,
  }
}

export function useHousekeepers() {
  return useQuery({
    queryKey: hotelQueryKey('housekeepers'),
    queryFn:  getHousekeepersApi,
    staleTime: 5 * 60 * 1000,
  })
}
