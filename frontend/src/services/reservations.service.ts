import api from '@/lib/axios'
import type {
  ApiResponse,
  Reservation,
  ReservationPayload,
  ReservationPayment,
  Stay,
} from '@/types'

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

export interface ReservationsListResult {
  data: Reservation[]
  meta: unknown
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

export interface BulkReservationResult {
  group_id: string
  reservations: Reservation[]
}

export interface ExtendReservationPayload {
  end_date: string
  agreed_price?: number
}

export interface CheckInFromReservationPayload {
  room_ids: string[]
  prices: Record<string, number>
  check_in_datetime?: string
  check_out_datetime?: string
  notes?: string
}

export interface AddReservationPaymentPayload {
  amount: number
  payment_method: string
  payment_type: string
  payment_date?: string
  notes?: string
}

export interface CancelReservationPaymentResult {
  id: string
  cancelled_at: string
}

export async function getReservationsApi(
  filters: ReservationFilters = {},
): Promise<ReservationsListResult> {
  const { data } = await api.get<ApiResponse<ReservationsListResult>>('/reservations', { params: filters })
  return data.data
}

export async function getReservationApi(id: string): Promise<Reservation> {
  const { data } = await api.get<ApiResponse<Reservation>>(`/reservations/${id}`)
  return data.data
}

export async function createReservationApi(payload: ReservationPayload): Promise<Reservation> {
  const { data } = await api.post<ApiResponse<Reservation>>('/reservations', payload)
  return data.data
}

export async function createBulkReservationsApi(payload: BulkReservationPayload): Promise<BulkReservationResult> {
  const { data } = await api.post<ApiResponse<BulkReservationResult>>('/reservations/bulk', payload)
  return data.data
}

export async function updateReservationApi(
  id: string,
  payload: Partial<ReservationPayload> & { status?: string },
): Promise<Reservation> {
  const { data } = await api.put<ApiResponse<Reservation>>(`/reservations/${id}`, payload)
  return data.data
}

export async function deleteReservationApi(id: string): Promise<void> {
  await api.delete(`/reservations/${id}`)
}

export async function cancelReservationApi(id: string, notes?: string): Promise<Reservation> {
  const { data } = await api.patch<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, { notes })
  return data.data
}

export async function extendReservationApi(
  id: string,
  payload: ExtendReservationPayload,
): Promise<Reservation> {
  const { data } = await api.patch<ApiResponse<Reservation>>(`/reservations/${id}/extend`, payload)
  return data.data
}

export async function checkInFromReservationApi(
  id: string,
  payload: CheckInFromReservationPayload,
): Promise<Stay> {
  const { data } = await api.post<ApiResponse<Stay>>(`/reservations/${id}/check-in`, payload)
  return data.data
}

export async function addReservationPaymentApi(
  id: string,
  payload: AddReservationPaymentPayload,
): Promise<ReservationPayment> {
  const { data } = await api.post<ApiResponse<ReservationPayment>>(`/reservations/${id}/payments`, payload)
  return data.data
}

export async function cancelReservationPaymentApi(
  reservationId: string,
  paymentId: string,
  reason: string,
): Promise<CancelReservationPaymentResult> {
  const { data } = await api.patch<ApiResponse<CancelReservationPaymentResult>>(
    `/reservations/${reservationId}/payments/${paymentId}/cancel`,
    { reason },
  )
  return data.data
}
