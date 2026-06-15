import api from '@/lib/axios'
import type { ApiResponse, CalendarData } from '@/types'

export async function getCalendarApi(start: string, end: string): Promise<CalendarData> {
  const { data } = await api.get<ApiResponse<CalendarData>>('/calendar', { params: { start, end } })
  return data.data
}
