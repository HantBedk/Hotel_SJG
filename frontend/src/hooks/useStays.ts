import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getStaysApi, getStayApi, createStayApi, checkoutStayApi,
  transferRoomApi, addPaymentApi, addServiceApi, getExtraServicesApi,
  extendStayApi, addMinibarChargesApi,
} from '@/services/stays.service'
import type { CheckInPayload, MinibarItem } from '@/types'

export function useStays(filters?: { status?: string; company_id?: string } | string) {
  const queryClient = useQueryClient()

  const normalizedFilters = typeof filters === 'string' ? { status: filters } : (filters ?? {})

  const { data, isLoading } = useQuery({
    queryKey: ['stays', normalizedFilters],
    queryFn:  () => getStaysApi(normalizedFilters),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['stays'] })
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
    onSuccess: () => toast.success('Consumos de minibar registrados.'),
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al registrar consumos.'),
  })

  const transferMutation = useMutation({
    mutationFn: ({ stayId, ...payload }: { stayId: string; from_room_id: string; to_room_id: string; reason?: string }) =>
      transferRoomApi(stayId, payload),
    onSuccess: () => { toast.success('Transferencia realizada.'); invalidate() },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al transferir.'),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ stayId, ...payload }: { stayId: string; amount: number; payment_method: string; payment_type: string; paid_by: string; notes?: string }) =>
      addPaymentApi(stayId, payload),
    onSuccess: () => { toast.success('Pago registrado.'); queryClient.invalidateQueries({ queryKey: ['stays'] }) },
    onError: () => toast.error('Error al registrar pago.'),
  })

  const serviceMutation = useMutation({
    mutationFn: ({ stayId, ...payload }: { stayId: string; extra_service_id: string; quantity: number }) =>
      addServiceApi(stayId, payload),
    onSuccess: () => { toast.success('Servicio agregado.'); queryClient.invalidateQueries({ queryKey: ['stays'] }) },
    onError: () => toast.error('Error al agregar servicio.'),
  })

  return {
    stays:        (data as { data: unknown[] })?.data ?? [],
    isLoading,
    checkIn:      (payload: CheckInPayload) => checkInMutation.mutateAsync(payload),
    checkOut:     checkOutMutation.mutate,
    extend:       extendMutation.mutateAsync,
    addMinibar:   minibarMutation.mutateAsync,
    transfer:     transferMutation.mutate,
    addPayment:   paymentMutation.mutate,
    addService:   serviceMutation.mutate,
    isCheckingIn:  checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    isExtending:   extendMutation.isPending,
  }
}

export function useStay(id: string) {
  return useQuery({
    queryKey: ['stays', id],
    queryFn:  () => getStayApi(id),
    enabled:  !!id,
  })
}

export function useExtraServices() {
  return useQuery({
    queryKey: ['extra-services'],
    queryFn:  getExtraServicesApi,
    staleTime: 5 * 60 * 1000,
  })
}
