import api from '@/lib/axios'
import type { ActivityLogEntry, ApiResponse, PaymentHistoryEntry, Suggestion } from '@/types'

// ── Activity logs ─────────────────────────────────────────────────────────────

export interface ActivityFilters {
  action?: string
  user_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface PaginatedPage<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export type ActivityLogsPage = PaginatedPage<ActivityLogEntry>

export interface ActivityActionOption {
  value: string
  label: string
}

export async function getActivityLogsApi(filters: ActivityFilters = {}): Promise<ActivityLogsPage> {
  const { data } = await api.get<ApiResponse<ActivityLogsPage>>('/activity-logs', { params: filters })
  return data.data
}

export async function getActivityActionsApi(): Promise<ActivityActionOption[]> {
  const { data } = await api.get<ApiResponse<ActivityActionOption[]>>('/activity-logs/actions')
  return data.data
}

// ── Payments history ──────────────────────────────────────────────────────────

export interface PaymentFilters {
  date_from?: string
  date_to?: string
  method?: string
  receptionist_id?: string
  guest?: string
  status?: 'active' | 'cancelled'
  page?: number
  per_page?: number
}

export type PaymentHistoryPage = PaginatedPage<PaymentHistoryEntry>

export async function getPaymentsHistoryApi(filters: PaymentFilters = {}): Promise<PaymentHistoryPage> {
  const { data } = await api.get<ApiResponse<PaymentHistoryPage>>('/reports/payments', { params: filters })
  return data.data
}

// ── Suggestions ───────────────────────────────────────────────────────────────

export async function getSuggestionsApi(): Promise<Suggestion[]> {
  const { data } = await api.get<ApiResponse<Suggestion[]>>('/suggestions')
  return data.data
}

export async function dismissSuggestionApi(id: string): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>(`/suggestions/${id}/dismiss`)
  return data
}
