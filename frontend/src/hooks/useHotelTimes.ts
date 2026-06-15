import { useQuery } from '@tanstack/react-query'
import { getSettingsApi } from '@/services/settings.service'

const DEFAULT_CHECK_IN  = '14:00'
const DEFAULT_CHECK_OUT = '12:00'
const HHMM_PATTERN = /^(\d{1,2}):(\d{2})/

function normalizeHHMM(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const m = HHMM_PATTERN.exec(value)
  if (!m) return fallback
  const hh = m[1].padStart(2, '0')
  return `${hh}:${m[2]}`
}

export function useHotelTimes() {
  const { data } = useQuery({
    queryKey: ['settings', 'hotel'],
    queryFn:  () => getSettingsApi('hotel'),
    staleTime: 5 * 60_000,
  })

  return {
    checkInTime:  normalizeHHMM(data?.['hotel.check_in_time'],  DEFAULT_CHECK_IN),
    checkOutTime: normalizeHHMM(data?.['hotel.check_out_time'], DEFAULT_CHECK_OUT),
  }
}
