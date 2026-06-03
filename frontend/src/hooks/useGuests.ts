import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getGuestsApi, createGuestApi, updateGuestApi, deleteGuestApi, searchGuestsApi,
} from '@/services/guests.service'
import { extractApiError } from '@/lib/apiError'
import type { Guest } from '@/types'

export function useGuests(search?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['guests', search],
    queryFn:  () => getGuestsApi(search),
  })

  const createMutation = useMutation({
    mutationFn: createGuestApi,
    onSuccess: () => {
      toast.success('Huésped creado.')
      queryClient.invalidateQueries({ queryKey: ['guests'] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al crear huésped.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Guest> }) =>
      updateGuestApi(id, payload),
    onSuccess: () => {
      toast.success('Huésped actualizado.')
      queryClient.invalidateQueries({ queryKey: ['guests'] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al actualizar huésped.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGuestApi,
    onSuccess: () => {
      toast.success('Huésped eliminado.')
      queryClient.invalidateQueries({ queryKey: ['guests'] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al eliminar huésped.')),
  })

  return {
    guests:       (data as { data: Guest[] })?.data ?? [],
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
  return useQuery({
    queryKey: ['guests', 'search', term],
    queryFn:  () => searchGuestsApi(term),
    enabled:  enabled && term.length >= 2,
    staleTime: 10_000,
  })
}
