import api from '@/lib/axios'
import type {
  MinibarSale,
  MinibarSalePaymentMethod,
  MinibarSaleStatus,
  MinibarSalesPage,
} from '@/types'

export interface MinibarSalesFilters {
  status?: MinibarSaleStatus
  from?: string
  to?: string
  search?: string
  page?: number
  per_page?: number
}

export interface CreateMinibarSalePayload {
  customer_name?: string | null
  customer_document?: string | null
  guest_id?: string | null
  notes?: string | null
  items: { minibar_product_id: string; quantity: number }[]
}

export const getMinibarSalesApi = async (
  filters?: MinibarSalesFilters,
): Promise<MinibarSalesPage> => {
  const res = await api.get('/minibar-sales', { params: filters })
  return res.data.data
}

export const getMinibarSaleApi = async (id: string): Promise<MinibarSale> => {
  const res = await api.get(`/minibar-sales/${id}`)
  return res.data.data
}

export const createMinibarSaleApi = async (
  data: CreateMinibarSalePayload,
): Promise<MinibarSale> => {
  const res = await api.post('/minibar-sales', data)
  return res.data.data
}

export const payMinibarSaleApi = async (
  id: string,
  data: { payment_method: MinibarSalePaymentMethod; guest_id?: string | null },
): Promise<MinibarSale> => {
  const res = await api.post(`/minibar-sales/${id}/pay`, data)
  return res.data.data
}

export const cancelMinibarSaleApi = async (
  id: string,
  data: { reason?: string } = {},
): Promise<MinibarSale> => {
  const res = await api.post(`/minibar-sales/${id}/cancel`, data)
  return res.data.data
}

export const deleteMinibarSaleApi = async (id: string): Promise<void> => {
  await api.delete(`/minibar-sales/${id}`)
}
