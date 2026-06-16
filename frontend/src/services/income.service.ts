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
  document_type: string | null
  document_number: string | null
  phone: string | null
  company_name: string | null
  check_in: string
  check_out: string
  check_in_datetime: string | null
  check_out_datetime: string | null
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
  total_rooms: number
  room_revenue: number
  potential_revenue: number
  occupancy_pct: number
  revenue_vs_potential_pct: number
  rooms: IncomeTonightRoom[]
}

export interface IncomeOccupancySummary {
  total_rooms: number
  avg_occupancy_pct: number
  total_potential_revenue: number
  total_room_revenue: number
  revenue_vs_potential_pct: number
  payments_vs_potential_pct: number
}

export interface IncomeSummary {
  period: { from: string; to: string; days: number }
  occupancy_summary: IncomeOccupancySummary
  tonight: {
    room_revenue: number
    rooms_count: number
    total_rooms: number
    potential_revenue: number
    occupancy_pct: number
    revenue_vs_potential_pct: number
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
  expected: number
  room_revenue: number
  occupancy_pct: number
}

export type IncomeGranularity = 'hour' | 'day'

export interface IncomeDaily {
  period: { from: string; to: string }
  granularity: IncomeGranularity
  data: IncomeDailyPoint[]
}

/** Clave estable para React Query (evita objetos anidados en queryKey). */
export function incomeQueryRangeKey(params: IncomeRangeParams): readonly unknown[] {
  if (params.preset) {
    return ['preset', params.preset]
  }
  return ['range', params.from ?? '', params.to ?? '']
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
  // El backend devuelve HTML imprimible (no PDF). El consumidor lo muestra en iframe.
  const { data } = await api.get<string>('/income/report', { params, responseType: 'text' })
  return data
}
