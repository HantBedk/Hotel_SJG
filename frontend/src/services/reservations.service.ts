import api from '@/lib/axios'
import type { Reservation, ReservationPayload, ReservationPayment, Stay } from '@/types'

export interface ReservationFilters {
  status?: string
  guest_id?: string
  room_id?: string
  from?: string
  to?: string
  search?: string
  page?: number
  per_page?: number
}

export const getReservationsApi = async (filters: ReservationFilters = {}): Promise<{ data: Reservation[]; meta: unknown }> => {
  const res = await api.get('/reservations', { params: filters })
  return res.data.data
}

export const getReservationApi = async (id: string): Promise<Reservation> => {
  const res = await api.get(`/reservations/${id}`)
  return res.data.data
}

export const createReservationApi = async (payload: ReservationPayload): Promise<Reservation> => {
  const res = await api.post('/reservations', payload)
  return res.data.data
}

export interface BulkReservationPayload {
  guest_id?: string
  company_id?: string
  room_ids: string[]
  start_date: string
  end_date: string
  prices: Record<string, number>
  billing_mode: 'single' | 'individual'
  deposit_amount?: number
  notes?: string
}

export const createBulkReservationsApi = async (payload: BulkReservationPayload): Promise<{ group_id: string; reservations: Reservation[] }> => {
  const res = await api.post('/reservations/bulk', payload)
  return res.data.data
}

export const updateReservationApi = async (id: string, payload: Partial<ReservationPayload> & { status?: string }): Promise<Reservation> => {
  const res = await api.put(`/reservations/${id}`, payload)
  return res.data.data
}

export const deleteReservationApi = async (id: string): Promise<void> => {
  await api.delete(`/reservations/${id}`)
}

export const cancelReservationApi = async (id: string, notes?: string): Promise<Reservation> => {
  const res = await api.patch(`/reservations/${id}/cancel`, { notes })
  return res.data.data
}

export const extendReservationApi = async (id: string, payload: { end_date: string; agreed_price?: number }): Promise<Reservation> => {
  const res = await api.patch(`/reservations/${id}/extend`, payload)
  return res.data.data
}

export const checkInFromReservationApi = async (
  id: string,
  payload: {
    room_ids: string[]
    prices: Record<string, number>
    check_in_datetime?: string
    check_out_datetime?: string
    notes?: string
  }
): Promise<Stay> => {
  const res = await api.post(`/reservations/${id}/check-in`, payload)
  return res.data.data
}

export const addReservationPaymentApi = async (
  id: string,
  payload: { amount: number; payment_method: string; payment_type: string; payment_date?: string; notes?: string }
): Promise<ReservationPayment> => {
  const res = await api.post(`/reservations/${id}/payments`, payload)
  return res.data.data
}

export const cancelReservationPaymentApi = async (
  reservationId: string,
  paymentId: string,
  reason: string,
): Promise<{ id: string; cancelled_at: string }> => {
  const res = await api.patch(`/reservations/${reservationId}/payments/${paymentId}/cancel`, { reason })
  return res.data.data
}
