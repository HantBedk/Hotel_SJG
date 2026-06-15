import { useQuery } from '@tanstack/react-query'
import { getNationalitiesApi } from '@/services/nationalities.service'

export function useNationalities() {
  return useQuery({
    queryKey: ['nationalities'],
    queryFn: getNationalitiesApi,
    staleTime: 1000 * 60 * 60 * 24,
  })
}
