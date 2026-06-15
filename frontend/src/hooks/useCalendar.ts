import { useQuery } from '@tanstack/react-query'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import { getCalendarApi } from '@/services/calendar.service'

export function useCalendar(start: string, end: string) {
  return useQuery({
    queryKey: hotelQueryKey('calendar', start, end),
    queryFn:  () => getCalendarApi(start, end),
    enabled:  !!start && !!end,
    staleTime: 60 * 1000,
  })
}
