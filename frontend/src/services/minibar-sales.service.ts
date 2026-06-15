import api from '@/lib/axios'
import type {
  ApiResponse,
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

export interface CreateMinibarSaleItem {
  minibar_product_id: string
  quantity: number
}

export interface CreateMinibarSalePayload {
  customer_name?: string | null
  customer_document?: string | null
  guest_id?: string | null
  notes?: string | null
  items: CreateMinibarSaleItem[]
}

export interface PayMinibarSalePayload {
  payment_method: MinibarSalePaymentMethod
  guest_id?: string | null
}

export interface CancelMinibarSalePayload {
  reason?: string
}

export async function getMinibarSalesApi(filters?: MinibarSalesFilters): Promise<MinibarSalesPage> {
  const { data } = await api.get<ApiResponse<MinibarSalesPage>>('/minibar-sales', { params: filters })
  return data.data
}

export async function getMinibarSaleApi(id: string): Promise<MinibarSale> {
  const { data } = await api.get<ApiResponse<MinibarSale>>(`/minibar-sales/${id}`)
  return data.data
}

export async function createMinibarSaleApi(payload: CreateMinibarSalePayload): Promise<MinibarSale> {
  const { data } = await api.post<ApiResponse<MinibarSale>>('/minibar-sales', payload)
  return data.data
}

export async function payMinibarSaleApi(id: string, payload: PayMinibarSalePayload): Promise<MinibarSale> {
  const { data } = await api.post<ApiResponse<MinibarSale>>(`/minibar-sales/${id}/pay`, payload)
  return data.data
}

export async function cancelMinibarSaleApi(
  id: string,
  payload: CancelMinibarSalePayload = {},
): Promise<MinibarSale> {
  const { data } = await api.post<ApiResponse<MinibarSale>>(`/minibar-sales/${id}/cancel`, payload)
  return data.data
}

export async function deleteMinibarSaleApi(id: string): Promise<void> {
  await api.delete(`/minibar-sales/${id}`)
}
