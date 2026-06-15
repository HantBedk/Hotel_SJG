import type { Company } from './company'
import type { Guest } from './guest'
import type { MinibarConsumption } from './minibar'
import type { Room } from './room'

export type StayStatus = 'active' | 'extended' | 'checked_out'
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'credito'
export type PaymentType = 'deposit' | 'partial' | 'final'
export type PaidBy = 'guest' | 'company' | 'mixed'

export interface StayRoom {
  id: string
  stay_id: string
  room_id: string
  room: Room
  check_in_date: string
  check_out_date: string
  price_per_night: string
  nights: number
  subtotal: string
  is_active: boolean
}

export interface ExtraService {
  id: string
  name: string
  price: string
  description: string | null
  active: boolean
}

export interface StayService {
  id: string
  stay_id: string
  extra_service_id: string
  extra_service?: ExtraService
  quantity: number
  unit_price: string
  total: string
  applied_at: string
  applied_by: string
}

export interface Payment {
  id: string
  stay_id: string
  amount: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  paid_by: PaidBy
  payment_split_details: Record<string, unknown> | null
  receipt_path: string | null
  receptionist_id: string
  payment_date: string
  notes: string | null
  created_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
  cancelled_by?: { id: string; name: string } | null
}

export interface StayGuest {
  id: string
  stay_id: string
  guest_id: string
  is_primary: boolean
  guest?: Guest
  created_at: string
  updated_at: string
}

export interface Stay {
  id: string
  guest_id: string
  company_id: string | null
  reservation_id: string | null
  status: StayStatus
  check_in_datetime: string
  check_out_datetime: string
  actual_check_out_datetime: string | null
  late_checkout_fee: string | null
  total_amount: string | null
  paid_amount: string
  notes: string | null
  receipt_number: string | null
  guest?: Guest
  company?: Company | null
  stay_rooms?: StayRoom[]
  stay_guests?: StayGuest[]
  payments?: Payment[]
  services?: StayService[]
  minibar_consumptions?: MinibarConsumption[]
  created_at: string
  updated_at: string
}

export interface CheckInPayload {
  guest_id: string
  company_id?: string
  room_ids: string[]
  check_in_datetime: string
  check_out_datetime: string
  prices: Record<string, number>
  notes?: string
  additional_guest_ids?: string[]
}
