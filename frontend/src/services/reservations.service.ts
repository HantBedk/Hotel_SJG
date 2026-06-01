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
}

export const getReservationsApi = async (filters: ReservationFilters = {}): Promise<{ data: Reservation[]; meta: unknown }> => {
  const res = await api.get('/v1/reservations', { params: filters })
  return res.data.data
}

export const getReservationApi = async (id: string): Promise<Reservation> => {
  const res = await api.get(`/v1/reservations/${id}`)
  return res.data.data
}

export const createReservationApi = async (payload: ReservationPayload): Promise<Reservation> => {
  const res = await api.post('/v1/reservations', payload)
  return res.data.data
}

export const updateReservationApi = async (id: string, payload: Partial<ReservationPayload> & { status?: string }): Promise<Reservation> => {
  const res = await api.put(`/v1/reservations/${id}`, payload)
  return res.data.data
}

export const deleteReservationApi = async (id: string): Promise<void> => {
  await api.delete(`/v1/reservations/${id}`)
}

export const cancelReservationApi = async (id: string, notes?: string): Promise<Reservation> => {
  const res = await api.patch(`/v1/reservations/${id}/cancel`, { notes })
  return res.data.data
}

export const extendReservationApi = async (id: string, payload: { end_date: string; agreed_price?: number }): Promise<Reservation> => {
  const res = await api.patch(`/v1/reservations/${id}/extend`, payload)
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
  const res = await api.post(`/v1/reservations/${id}/check-in`, payload)
  return res.data.data
}

export const addReservationPaymentApi = async (
  id: string,
  payload: { amount: number; payment_method: string; payment_type: string; payment_date?: string; notes?: string }
): Promise<ReservationPayment> => {
  const res = await api.post(`/v1/reservations/${id}/payments`, payload)
  return res.data.data
}
