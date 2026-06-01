import { useQuery } from '@tanstack/react-query'
import { getCalendarApi } from '@/services/calendar.service'

export function useCalendar(start: string, end: string) {
  return useQuery({
    queryKey: ['calendar', start, end],
    queryFn:  () => getCalendarApi(start, end),
    enabled:  !!start && !!end,
    staleTime: 60 * 1000,
  })
}
