import api from '@/lib/axios'
import type { CalendarData } from '@/types'

export const getCalendarApi = async (start: string, end: string): Promise<CalendarData> => {
  const res = await api.get('/v1/calendar', { params: { start, end } })
  return res.data.data
}
