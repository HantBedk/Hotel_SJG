import { useQuery } from '@tanstack/react-query'
import { useHotelQueryKey } from '@/lib/hotelQueryKey'
import { useHotelStore } from '@/store/hotelStore'
import {
  getIncomeDailyApi,
  getIncomeSummaryApi,
  incomeQueryRangeKey,
  type IncomeRangeParams,
} from '@/services/income.service'

export function useIncomeSummary(params: IncomeRangeParams) {
  const hotelId = useHotelStore((s) => s.currentHotelId)
  const rangeKey = incomeQueryRangeKey(params)
  const queryKey = useHotelQueryKey('income', 'summary', ...rangeKey)

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => getIncomeSummaryApi(params),
    enabled: !!hotelId,
    refetchInterval: 60_000,
    staleTime: 0,
  })

  return { summary: data, isLoading, isFetching }
}

export function useIncomeDaily(params: IncomeRangeParams) {
  const hotelId = useHotelStore((s) => s.currentHotelId)
  const rangeKey = incomeQueryRangeKey(params)
  const queryKey = useHotelQueryKey('income', 'daily', ...rangeKey)

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => getIncomeDailyApi(params),
    enabled: !!hotelId,
    refetchInterval: 60_000,
    staleTime: 0,
  })

  return { daily: data, isLoading, isFetching }
}
