import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '@/services/dashboard.service'

export function useDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboardApi,
    refetchInterval: 60_000,
  })

  return { stats: data, isLoading }
}
