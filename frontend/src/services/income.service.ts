import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export type IncomePreset = 'today' | 'week' | 'month' | 'last_30' | 'custom'

export interface IncomeRangeParams {
  preset?: Exclude<IncomePreset, 'custom'>
  from?: string
  to?: string
}

export interface IncomeTonightRoom {
  stay_room_id: string
  stay_id: string
  room_id: string
  room_number: string | null
  guest_name: string | null
  company_name: string | null
  check_in: string
  check_out: string
  price: number
  status: string | null
}

export interface IncomePayment {
  id: string
  stay_id: string
  amount: number
  payment_method: string
  payment_type: string
  paid_by: string
  payment_date: string
  notes: string | null
  guest_name: string | null
  company_name: string | null
  receptionist: string | null
}

export interface IncomeByMethod {
  method: string
  count: number
  total: number
}

export interface IncomeNight {
  date: string
  rooms_count: number
  room_revenue: number
  rooms: IncomeTonightRoom[]
}

export interface IncomeSummary {
  period: { from: string; to: string; days: number }
  tonight: {
    room_revenue: number
    rooms_count: number
    rooms: IncomeTonightRoom[]
  }
  nights: IncomeNight[]
  range: {
    payments_received: number
    payments_count: number
    services_billed: number
    minibar_billed: number
    rooms_billed: number
    total_billed: number
  }
  payments_by_method: IncomeByMethod[]
  recent_payments: IncomePayment[]
}

export interface IncomeDailyPoint {
  date: string
  label: string
  total: number
}

export interface IncomeDaily {
  period: { from: string; to: string }
  granularity: 'hour' | 'day'
  data: IncomeDailyPoint[]
}

export async function getIncomeSummaryApi(params: IncomeRangeParams = {}): Promise<IncomeSummary> {
  const { data } = await api.get<ApiResponse<IncomeSummary>>('/income/summary', { params })
  return data.data
}

export async function getIncomeDailyApi(params: IncomeRangeParams = {}): Promise<IncomeDaily> {
  const { data } = await api.get<ApiResponse<IncomeDaily>>('/income/daily', { params })
  return data.data
}

export async function fetchIncomeReportHtml(params: IncomeRangeParams = {}): Promise<string> {
  // El backend devuelve un HTML imprimible (no un PDF binario). El consumidor
  // lo renderiza en un iframe dentro de un modal para mantener la navegación
  // del usuario en la misma página.
  const response = await api.get<string>('/income/report', { params, responseType: 'text' })
  return response.data
}
