import type { Stay } from './stay'

export type StayVoidRequestStatus = 'pending' | 'approved' | 'rejected'

export interface StayVoidRequestUser {
  id: string
  name: string
}

export interface StayVoidRequest {
  id: string
  hotel_id: string
  stay_id: string
  requested_by_id: string
  reason: string
  status: StayVoidRequestStatus
  reviewed_by_id: string | null
  admin_notes: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  stay?: Stay
  requested_by?: StayVoidRequestUser
  reviewed_by?: StayVoidRequestUser | null
}

export interface StayVoidRequestListResponse {
  data: StayVoidRequest[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
