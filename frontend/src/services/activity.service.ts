import api from '@/lib/axios'
import type { ActivityLogEntry, PaymentHistoryEntry, Suggestion } from '../types'

// ── Activity logs ─────────────────────────────────────────────────────────────

export interface ActivityFilters {
  action?: string
  user_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export const getActivityLogsApi = (filters: ActivityFilters = {}) =>
  api.get('/activity-logs', { params: filters }).then(r => r.data.data as {
    data: ActivityLogEntry[]
    current_page: number
    last_page: number
    total: number
  })

export const getActivityActionsApi = () =>
  api.get('/activity-logs/actions').then(r => r.data.data as { value: string; label: string }[])

// ── Payments history ──────────────────────────────────────────────────────────

export interface PaymentFilters {
  date_from?: string
  date_to?: string
  method?: string
  receptionist_id?: string
  guest?: string
  page?: number
  per_page?: number
}

export const getPaymentsHistoryApi = (filters: PaymentFilters = {}) =>
  api.get('/reports/payments', { params: filters }).then(r => r.data.data as {
    data: PaymentHistoryEntry[]
    current_page: number
    last_page: number
    total: number
  })

// ── Suggestions ───────────────────────────────────────────────────────────────

export const getSuggestionsApi = () =>
  api.get('/suggestions').then(r => r.data.data as Suggestion[])

export const dismissSuggestionApi = (id: string) =>
  api.post(`/suggestions/${id}/dismiss`).then(r => r.data)
