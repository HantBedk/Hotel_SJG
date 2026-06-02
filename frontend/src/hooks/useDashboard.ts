import { useQuery } from '@tanstack/react-query'
import { getDashboardApi, getOccupancyHistoryApi } from '@/services/dashboard.service'

export function useDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboardApi,
    refetchInterval: 60_000,
  })

  return { stats: data, isLoading }
}

export function useOccupancyHistory(period: 'weekly' | 'monthly') {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'occupancy-history', period],
    queryFn:  () => getOccupancyHistoryApi(period),
    refetchInterval: 300_000,
  })

  return { history: data, isLoading }
}
