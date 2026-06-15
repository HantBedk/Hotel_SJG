import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import toast from 'react-hot-toast'
import {
  cancelMinibarSaleApi,
  createMinibarSaleApi,
  deleteMinibarSaleApi,
  getMinibarSaleApi,
  getMinibarSalesApi,
  payMinibarSaleApi,
  type MinibarSalesFilters,
} from '@/services/minibar-sales.service'
import type { MinibarSalePaymentMethod } from '@/types'

type ApiError = { response?: { data?: { message?: string } } }
const errMsg = (e: ApiError, fallback: string) => e?.response?.data?.message ?? fallback

const KEY = 'minibar-sales'

export function useMinibarSales(filters?: MinibarSalesFilters) {
  return useQuery({
    queryKey: hotelQueryKey(KEY, filters),
    queryFn: () => getMinibarSalesApi(filters),
    staleTime: 15_000,
  })
}

export function useMinibarSale(id: string | null) {
  return useQuery({
    queryKey: hotelQueryKey(KEY, 'detail', id),
    queryFn: () => getMinibarSaleApi(id as string),
    enabled: !!id,
  })
}

export function useMinibarSaleMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: hotelQueryKey(KEY) })
    qc.invalidateQueries({ queryKey: hotelQueryKey('minibar-products') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('inventory-items') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('inventory-history') })
  }

  const createMutation = useMutation({
    mutationFn: createMinibarSaleApi,
    onSuccess: () => {
      toast.success('Venta registrada (pendiente de pago).')
      invalidate()
    },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al registrar la venta.')),
  })

  const payMutation = useMutation({
    mutationFn: ({ id, payment_method, guest_id }: { id: string; payment_method: MinibarSalePaymentMethod; guest_id?: string | null }) =>
      payMinibarSaleApi(id, { payment_method, guest_id }),
    onSuccess: () => {
      toast.success('Venta pagada.')
      invalidate()
    },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al cobrar la venta.')),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelMinibarSaleApi(id, { reason }),
    onSuccess: () => {
      toast.success('Venta cancelada.')
      invalidate()
    },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al cancelar la venta.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMinibarSaleApi,
    onSuccess: () => {
      toast.success('Venta descartada.')
      invalidate()
    },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al descartar la venta.')),
  })

  return { createMutation, payMutation, cancelMutation, deleteMutation }
}
