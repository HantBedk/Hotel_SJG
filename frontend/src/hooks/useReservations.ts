import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getReservationsApi,
  getReservationApi,
  createReservationApi,
  updateReservationApi,
  cancelReservationApi,
  extendReservationApi,
  checkInFromReservationApi,
  addReservationPaymentApi,
  type ReservationFilters,
} from '@/services/reservations.service'
import type { ReservationPayload } from '@/types'

export function useReservations(filters: ReservationFilters = {}) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', filters],
    queryFn:  () => getReservationsApi(filters),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reservations'] })
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    queryClient.invalidateQueries({ queryKey: ['calendar'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const createMutation = useMutation({
    mutationFn: createReservationApi,
    onSuccess: () => { toast.success('Reserva creada.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al crear reserva.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof updateReservationApi>[1]) =>
      updateReservationApi(id, payload),
    onSuccess: () => { toast.success('Reserva actualizada.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al actualizar reserva.'),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => cancelReservationApi(id, notes),
    onSuccess: () => { toast.success('Reserva cancelada.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al cancelar.'),
  })

  const extendMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; end_date: string; agreed_price?: number }) =>
      extendReservationApi(id, payload),
    onSuccess: () => { toast.success('Reserva extendida.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al extender.'),
  })

  const checkInMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof checkInFromReservationApi>[1]) =>
      checkInFromReservationApi(id, payload),
    onSuccess: () => {
      toast.success('Check-in desde reserva realizado.')
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['stays'] })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al hacer check-in.'),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof addReservationPaymentApi>[1]) =>
      addReservationPaymentApi(id, payload),
    onSuccess: () => { toast.success('Pago registrado.'); invalidate() },
    onError: () => toast.error('Error al registrar pago.'),
  })

  return {
    reservations:  (data as { data: unknown[] })?.data ?? [],
    meta:          (data as { meta: unknown })?.meta,
    isLoading,
    create:        (payload: ReservationPayload) => createMutation.mutateAsync(payload),
    update:        updateMutation.mutate,
    cancel:        cancelMutation.mutate,
    extend:        extendMutation.mutate,
    checkIn:       (payload: Parameters<typeof checkInMutation.mutate>[0]) => checkInMutation.mutateAsync(payload),
    addPayment:    paymentMutation.mutate,
    isCreating:    createMutation.isPending,
    isCheckingIn:  checkInMutation.isPending,
  }
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservations', id],
    queryFn:  () => getReservationApi(id),
    enabled:  !!id,
  })
}
