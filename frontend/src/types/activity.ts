import type { PaidBy, PaymentMethod, PaymentType } from './stay'

export interface ActivityLogEntry {
  id: string
  action: string
  action_label: string
  user_id: string | null
  user_name: string
  user_role: string | null
  room_label: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

export type SuggestionType = 'minibar_restock' | 'price_adjustment' | 'corporate_rate'

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  confidence_score: string
  data: Record<string, unknown> | null
  dismissed: boolean
  dismissed_by: string | null
  created_at: string
  updated_at: string
}

export interface PaymentHistoryEntry {
  id: string
  stay_id: string
  guest_name: string
  amount: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  paid_by: PaidBy
  receptionist: string
  payment_date: string
  notes: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
}
