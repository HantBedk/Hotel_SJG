import { useQuery } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import {
  getIncomeDailyApi,
  getIncomeSummaryApi,
  type IncomeRangeParams,
} from '@/services/income.service'

export function useIncomeSummary(params: IncomeRangeParams) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: hotelQueryKey('income', 'summary', params),
    queryFn:  () => getIncomeSummaryApi(params),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  return { summary: data, isLoading, isFetching }
}

export function useIncomeDaily(params: IncomeRangeParams) {
  const { data, isLoading } = useQuery({
    queryKey: hotelQueryKey('income', 'daily', params),
    queryFn:  () => getIncomeDailyApi(params),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  return { daily: data, isLoading }
}
