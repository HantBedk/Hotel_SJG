import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getRoomsApi, getRoomTypesApi, createRoomApi,
  updateRoomApi, updateRoomStatusApi, deleteRoomApi,
  getHousekeepersApi,
} from '@/services/rooms.service'
import type { Room, RoomStatus } from '@/types'

export function useRooms(statusFilter?: RoomStatus) {
  const queryClient = useQueryClient()

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn:  () => getRoomsApi(statusFilter),
  })

  const { data: roomTypes = [] } = useQuery({
    queryKey: ['room-types'],
    queryFn:  getRoomTypesApi,
    staleTime: Infinity,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: RoomStatus; notes?: string }) =>
      updateRoomStatusApi(id, { status, notes }),
    onSuccess: () => { toast.success('Estado actualizado.'); invalidate() },
    onError:   () => toast.error('Error al cambiar estado.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoomApi,
    onSuccess: () => { toast.success('Habitación desactivada.'); invalidate() },
    onError:   () => toast.error('Error al desactivar.'),
  })

  // Sync room when Reverb broadcasts a status change
  const syncRoomStatus = (roomId: string, status: RoomStatus) => {
    // Update the unfiltered list in-place
    queryClient.setQueryData<Room[]>(['rooms', undefined], (prev) =>
      prev?.map((r) => r.id === roomId ? { ...r, status } : r) ?? []
    )
    // For the filtered list: if the room's new status no longer matches the filter,
    // invalidate so it gets removed; otherwise patch it
    if (statusFilter && status !== statusFilter) {
      queryClient.invalidateQueries({ queryKey: ['rooms', statusFilter] })
    } else {
      queryClient.setQueryData<Room[]>(['rooms', statusFilter], (prev) =>
        prev?.map((r) => r.id === roomId ? { ...r, status } : r) ?? []
      )
    }
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
    queryKey: ['housekeepers'],
    queryFn:  getHousekeepersApi,
    staleTime: 5 * 60 * 1000,
  })
}
