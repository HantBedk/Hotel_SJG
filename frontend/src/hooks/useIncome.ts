import { useQuery } from '@tanstack/react-query'
import {
  getIncomeDailyApi,
  getIncomeSummaryApi,
  type IncomeRangeParams,
} from '@/services/income.service'

export function useIncomeSummary(params: IncomeRangeParams) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['income', 'summary', params],
    queryFn:  () => getIncomeSummaryApi(params),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  return { summary: data, isLoading, isFetching }
}

export function useIncomeDaily(params: IncomeRangeParams) {
  const { data, isLoading } = useQuery({
    queryKey: ['income', 'daily', params],
    queryFn:  () => getIncomeDailyApi(params),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  return { daily: data, isLoading }
}
