import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import toast from 'react-hot-toast'
import {
  getGuestsApi, createGuestApi, updateGuestApi, deleteGuestApi, searchGuestsApi,
  extractGuestList,
  type CreateGuestPayload,
} from '@/services/guests.service'
import { extractApiError } from '@/lib/apiError'

export function useGuests(search?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: hotelQueryKey('guests', search),
    queryFn:  () => getGuestsApi(search),
  })

  const createMutation = useMutation({
    mutationFn: createGuestApi,
    onSuccess: () => {
      toast.success('Huésped creado.')
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('guests') })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al crear huésped.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateGuestPayload> }) =>
      updateGuestApi(id, payload),
    onSuccess: () => {
      toast.success('Huésped actualizado.')
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('guests') })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al actualizar huésped.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGuestApi,
    onSuccess: () => {
      toast.success('Huésped eliminado.')
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('guests') })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al eliminar huésped.')),
  })

  return {
    guests:       extractGuestList(data ?? []),
    meta:         (data as { meta: unknown })?.meta,
    isLoading,
    createGuest:  createMutation.mutate,
    updateGuest:  updateMutation.mutate,
    deleteGuest:  deleteMutation.mutate,
    isCreating:   createMutation.isPending,
    isUpdating:   updateMutation.isPending,
    isDeleting:   deleteMutation.isPending,
  }
}

export function useGuestSearch(term: string, enabled = true) {
  const trimmed = term.trim()
  return useQuery({
    queryKey: hotelQueryKey('guests', 'search', trimmed),
    queryFn:  () => searchGuestsApi(trimmed),
    enabled:  enabled && trimmed.length >= 1,
    staleTime: 10_000,
  })
}
