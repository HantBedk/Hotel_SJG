import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  dismissSuggestionApi,
  getActivityActionsApi,
  getActivityLogsApi,
  getPaymentsHistoryApi,
  getSuggestionsApi,
  type ActivityFilters,
  type PaymentFilters,
} from '../services/activity.service'

export function useActivityLogs(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => getActivityLogsApi(filters),
    placeholderData: prev => prev,
  })
}

export function useActivityActions() {
  return useQuery({
    queryKey: ['activity-logs', 'actions'],
    queryFn: getActivityActionsApi,
    staleTime: 60_000,
  })
}

export function usePaymentsHistory(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ['payments-history', filters],
    queryFn: () => getPaymentsHistoryApi(filters),
    placeholderData: prev => prev,
  })
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: getSuggestionsApi,
    refetchInterval: 5 * 60_000,
  })
}

export function useDismissSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dismissSuggestionApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suggestions'] }),
  })
}
