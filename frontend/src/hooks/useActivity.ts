import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import {
  dismissSuggestionApi,
  getActivityActionsApi,
  getActivityLogsApi,
  getPaymentsHistoryApi,
  getSuggestionsApi,
  type ActivityFilters,
  type PaymentFilters,
} from '../services/activity.service'

export function useActivityLogs(
  filters: ActivityFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: hotelQueryKey('activity-logs', filters),
    queryFn: () => getActivityLogsApi(filters),
    refetchOnMount: 'always',
    enabled: options.enabled ?? true,
  })
}

export function useActivityActions() {
  return useQuery({
    queryKey: hotelQueryKey('activity-logs', 'actions'),
    queryFn: getActivityActionsApi,
    staleTime: 60_000,
  })
}

export function usePaymentsHistory(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: hotelQueryKey('payments-history', filters),
    queryFn: () => getPaymentsHistoryApi(filters),
    placeholderData: prev => prev,
  })
}

export function useSuggestions() {
  return useQuery({
    queryKey: hotelQueryKey('suggestions'),
    queryFn: getSuggestionsApi,
    refetchInterval: 5 * 60_000,
  })
}

export function useDismissSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dismissSuggestionApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: hotelQueryKey('suggestions') }),
  })
}
