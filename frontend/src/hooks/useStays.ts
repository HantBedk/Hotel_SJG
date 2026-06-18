import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import toast from 'react-hot-toast'
import {
  getStaysApi, getStayApi, createStayApi, checkoutStayApi,
  transferRoomApi, addPaymentApi, cancelStayPaymentApi,
  addServiceApi, getExtraServicesApi,
  extendStayApi, addMinibarChargesApi, cancelMinibarConsumptionApi,
} from '@/services/stays.service'
import type { CheckInPayload, MinibarItem, Stay } from '@/types'

function activeRoomNumbers(stay: Stay): string {
  const numbers = stay.stay_rooms
    ?.filter((sr) => sr.is_active)
    .map((sr) => sr.room?.number)
    .filter(Boolean)
  return numbers?.length ? numbers.join(', ') : '—'
}

function patchStayInListCache(queryClient: QueryClient, updatedStay: Stay): void {
  queryClient.setQueriesData(
    { queryKey: hotelQueryKey('stays') },
    (old: unknown) => {
      if (!old || typeof old !== 'object' || !('data' in old)) return old
      const page = old as { data: Stay[] | { data: Stay[] } }
      if (Array.isArray(page.data)) {
        return {
          ...page,
          data: page.data.map((s) => (s.id === updatedStay.id ? updatedStay : s)),
        }
      }
      if (page.data && typeof page.data === 'object' && 'data' in page.data && Array.isArray(page.data.data)) {
        return {
          ...page,
          data: {
            ...page.data,
            data: page.data.data.map((s) => (s.id === updatedStay.id ? updatedStay : s)),
          },
        }
      }
      return old
    },
  )
}

export function useStays(filters?: { status?: string; company_id?: string } | string) {
  const queryClient = useQueryClient()

  const normalizedFilters = typeof filters === 'string' ? { status: filters } : (filters ?? {})

  const { data, isLoading } = useQuery({
    queryKey: hotelQueryKey('stays', normalizedFilters),
    queryFn:  () => getStaysApi(normalizedFilters),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('rooms') })
    queryClient.invalidateQueries({ queryKey: hotelQueryKey('dashboard') })
  }

  const checkInMutation = useMutation({
    mutationFn: createStayApi,
    onSuccess: () => { toast.success('Check-in realizado.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al realizar check-in.'),
  })

  const checkOutMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; actual_check_out_datetime?: string; late_checkout_fee?: number; notes?: string }) =>
      checkoutStayApi(id, payload),
    onSuccess: () => { toast.success('Checkout realizado.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al realizar checkout.'),
  })

  const extendMutation = useMutation({
    mutationFn: ({ id, check_out_datetime }: { id: string; check_out_datetime: string }) =>
      extendStayApi(id, { check_out_datetime }),
    onSuccess: () => { toast.success('Estadía extendida.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al extender estadía.'),
  })

  const minibarMutation = useMutation({
    mutationFn: ({ stayId, items }: { stayId: string; items: MinibarItem[] }) =>
      addMinibarChargesApi(stayId, { items }),
    onSuccess: () => {
      toast.success('Consumos de minibar registrados.')
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('room-minibars') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('minibar-products') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('minibars') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('inventory-items') })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al registrar consumos.'),
  })

  const transferMutation = useMutation({
    mutationFn: ({ stayId, ...payload }: { stayId: string; from_room_id: string; to_room_id: string; reason?: string }) =>
      transferRoomApi(stayId, payload),
    onSuccess: (updatedStay, { stayId }) => {
      queryClient.setQueryData(hotelQueryKey('stays', stayId), updatedStay)
      patchStayInListCache(queryClient, updatedStay)
      const label = activeRoomNumbers(updatedStay)
      toast.success(`Transferencia realizada. Habitación actual: ${label}.`)
      invalidate()
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al transferir habitación.'),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ stayId, ...payload }: { stayId: string; amount: number; payment_method: string; payment_type: string; paid_by: string; notes?: string }) =>
      addPaymentApi(stayId, payload),
    onSuccess: () => { toast.success('Pago registrado.'); queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') }) },
    onError: () => toast.error('Error al registrar pago.'),
  })

  const cancelPaymentMutation = useMutation({
    mutationFn: ({ stayId, paymentId, reason }: { stayId: string; paymentId: string; reason: string }) =>
      cancelStayPaymentApi(stayId, paymentId, reason),
    onSuccess: () => {
      toast.success('Pago anulado. Queda en el historial.')
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('stay-payments') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('payments-history') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('income') })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al anular el pago.'),
  })

  const cancelMinibarMutation = useMutation({
    mutationFn: ({ stayId, consumptionId, reason }: { stayId: string; consumptionId: string; reason: string }) =>
      cancelMinibarConsumptionApi(stayId, consumptionId, reason),
    onSuccess: () => {
      toast.success('Consumo anulado. Queda en el historial.')
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('room-minibars') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('minibar-products') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('minibars') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('inventory-items') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('income') })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al anular el consumo.'),
  })

  const serviceMutation = useMutation({
    mutationFn: ({ stayId, ...payload }: { stayId: string; extra_service_id: string; quantity: number }) =>
      addServiceApi(stayId, payload),
    onSuccess: () => { toast.success('Servicio agregado.'); queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') }) },
    onError: () => toast.error('Error al agregar servicio.'),
  })

  return {
    stays:        (data as { data: unknown[] })?.data ?? [],
    isLoading,
    checkIn:      (payload: CheckInPayload) => checkInMutation.mutateAsync(payload),
    checkOut:     checkOutMutation.mutate,
    extend:       extendMutation.mutateAsync,
    addMinibar:   minibarMutation.mutateAsync,
    transfer:     transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
    addPayment:   paymentMutation.mutate,
    cancelPayment: cancelPaymentMutation.mutateAsync,
    cancelMinibar: cancelMinibarMutation.mutateAsync,
    addService:   serviceMutation.mutate,
    isCheckingIn:  checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    isExtending:   extendMutation.isPending,
    isCancellingPayment: cancelPaymentMutation.isPending,
    isCancellingMinibar: cancelMinibarMutation.isPending,
  }
}

export function useStay(id: string) {
  return useQuery({
    queryKey: hotelQueryKey('stays', id),
    queryFn:  () => getStayApi(id),
    enabled:  !!id,
  })
}

export function useExtraServices() {
  return useQuery({
    queryKey: hotelQueryKey('extra-services'),
    queryFn:  getExtraServicesApi,
    staleTime: 5 * 60 * 1000,
  })
}
