import api from '@/lib/axios'
import type { CheckInPayload, ExtraService, MinibarItem, Stay, StayAccount, StayService } from '@/types'

export const getStaysApi = async (
  filters?: { status?: string; company_id?: string; page?: number; per_page?: number }
): Promise<{ data: Stay[]; meta: unknown }> => {
  const res = await api.get('/v1/stays', { params: filters ?? {} })
  return res.data.data
}

export const getStayApi = async (id: string): Promise<Stay> => {
  const res = await api.get(`/v1/stays/${id}`)
  return res.data.data
}

export const createStayApi = async (payload: CheckInPayload): Promise<Stay> => {
  const res = await api.post('/v1/stays', payload)
  return res.data.data
}

export const checkoutStayApi = async (
  id: string,
  payload: { actual_check_out_datetime?: string; late_checkout_fee?: number; notes?: string }
): Promise<Stay> => {
  const res = await api.patch(`/v1/stays/${id}/checkout`, payload)
  return res.data.data
}

export const getStayAccountApi = async (id: string): Promise<StayAccount> => {
  const res = await api.get(`/v1/stays/${id}/account`)
  return res.data.data
}

export const extendStayApi = async (id: string, payload: { check_out_datetime: string }): Promise<Stay> => {
  const res = await api.post(`/v1/stays/${id}/extend`, payload)
  return res.data.data
}

export const addRoomToStayApi = async (
  id: string,
  payload: { room_id: string; price_per_night: number }
): Promise<Stay> => {
  const res = await api.post(`/v1/stays/${id}/add-room`, payload)
  return res.data.data
}

export const addMinibarChargesApi = async (
  id: string,
  payload: { items: MinibarItem[] }
): Promise<unknown> => {
  const res = await api.post(`/v1/stays/${id}/minibar`, payload)
  return res.data.data
}

export const downloadStayReceiptApi = async (id: string): Promise<Blob> => {
  const res = await api.get(`/v1/stays/${id}/receipt`, { responseType: 'blob' })
  return res.data
}

export const transferRoomApi = async (
  stayId: string,
  payload: { from_room_id: string; to_room_id: string; reason?: string; notes?: string }
): Promise<Stay> => {
  const res = await api.post(`/v1/stays/${stayId}/transfer`, payload)
  return res.data.data
}

export const addPaymentApi = async (
  stayId: string,
  payload: {
    amount: number
    payment_method: string
    payment_type: string
    paid_by: string
    payment_split_details?: Record<string, unknown>
    payment_date?: string
    notes?: string
  }
): Promise<Stay> => {
  const res = await api.post(`/v1/stays/${stayId}/payments`, payload)
  return res.data.data
}

export const addServiceApi = async (
  stayId: string,
  payload: { extra_service_id: string; quantity: number }
): Promise<StayService> => {
  const res = await api.post(`/v1/stays/${stayId}/services`, payload)
  return res.data.data
}

export const getExtraServicesApi = async (): Promise<ExtraService[]> => {
  const res = await api.get('/v1/extra-services')
  return res.data.data
}
