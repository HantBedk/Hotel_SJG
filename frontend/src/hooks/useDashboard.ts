import { useQuery } from '@tanstack/react-query'
import { getDashboardApi, getOccupancyHistoryApi } from '@/services/dashboard.service'
import { useHotelQueryKey } from '@/lib/hotelQueryKey'

export function useDashboard() {
  const queryKey = useHotelQueryKey('dashboard')
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn:  getDashboardApi,
    refetchInterval: 60_000,
  })

  return { stats: data, isLoading }
}

export function useOccupancyHistory(period: 'weekly' | 'monthly') {
  const queryKey = useHotelQueryKey('dashboard', 'occupancy-history', period)
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn:  () => getOccupancyHistoryApi(period),
    refetchInterval: 300_000,
  })

  return { history: data, isLoading }
}
