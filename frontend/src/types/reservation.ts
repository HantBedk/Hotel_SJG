import type { Company } from './company'
import type { Guest } from './guest'
import type { House } from './house'
import type { Room } from './room'
import type { PaymentMethod, PaymentType, Stay } from './stay'

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show'
export type ReservationPaymentStatus = 'pending' | 'partial' | 'paid'

export interface ReservationPayment {
  id: string
  reservation_id: string
  amount: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  receptionist_id: string
  payment_date: string
  notes: string | null
  created_at: string
}

export interface Reservation {
  id: string
  group_id?: string | null
  billing_mode?: 'single' | 'individual' | null
  guest_id: string | null
  company_id: string | null
  room_id: string | null
  house_id: string | null
  status: ReservationStatus
  start_date: string
  end_date: string
  nights: number
  agreed_price: string
  deposit_amount: string | null
  payment_status: ReservationPaymentStatus
  created_by: string
  notes: string | null
  guest?: Guest | null
  company?: Company | null
  room?: Room | null
  house?: House | null
  payments?: ReservationPayment[]
  stay?: Stay | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ReservationPayload {
  guest_id?: string
  company_id?: string
  room_id?: string
  house_id?: string
  start_date: string
  end_date: string
  agreed_price: number
  deposit_amount?: number
  notes?: string
}
