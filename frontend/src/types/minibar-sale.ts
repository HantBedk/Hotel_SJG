import type { PaginatedPage } from './pagination'
import type { MinibarProduct } from './minibar'

export type MinibarSaleStatus = 'pending' | 'paid' | 'cancelled'
export type MinibarSalePaymentMethod = 'cash' | 'transfer' | 'card' | 'credit'

export interface MinibarSaleItem {
  id: string
  minibar_sale_id: string
  minibar_product_id: string
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: string
  total: string
  product?: MinibarProduct | null
}

export interface MinibarSale {
  id: string
  sale_number: string
  customer_name: string | null
  customer_document: string | null
  subtotal: string
  total: string
  payment_method: MinibarSalePaymentMethod | null
  status: MinibarSaleStatus
  paid_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  notes: string | null
  guest_id: string | null
  guest?: { id: string; full_name: string; document_type: string; document_number: string; phone: string | null } | null
  // Cuando la relación está cargada, el backend envía el objeto en `registered_by`
  // (sobreescribe el UUID). Cuando no, viene como string.
  registered_by: string | { id: string; name: string } | null
  cancelled_by_id: string | { id: string; name: string } | null
  items?: MinibarSaleItem[]
  created_at: string
  updated_at: string
}

export type MinibarSalesPage = PaginatedPage<MinibarSale>
