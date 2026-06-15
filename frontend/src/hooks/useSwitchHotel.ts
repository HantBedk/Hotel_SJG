import { useQueryClient } from '@tanstack/react-query'
import { useHotelStore } from '@/store/hotelStore'
import { disconnectEcho } from '@/hooks/useReverb'

const MIN_OVERLAY_MS = 280

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

function isHotelQueryKey(key: unknown, hotelId: string): boolean {
  return Array.isArray(key) && key[0] === 'hotel' && key[1] === hotelId
}

/** Cambia el tenant activo con overlay de carga y refetch coordinado. */
export function useSwitchHotel() {
  const queryClient = useQueryClient()
  const setCurrentHotel = useHotelStore((s) => s.setCurrentHotel)
  const setSwitchingHotel = useHotelStore((s) => s.setSwitchingHotel)

  return async (hotelId: string) => {
    const { currentHotelId: previousId, isSwitchingHotel } = useHotelStore.getState()
    if (previousId === hotelId || isSwitchingHotel) return

    const startedAt = Date.now()

    setSwitchingHotel(true)
    setCurrentHotel(hotelId)
    disconnectEcho()

    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey
        return Array.isArray(key) && key[0] === 'hotel' && key[1] !== hotelId
      },
    })

    try {
      await queryClient.refetchQueries({
        predicate: (query) => isHotelQueryKey(query.queryKey, hotelId),
        type: 'active',
      })
    } finally {
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_OVERLAY_MS) {
        await wait(MIN_OVERLAY_MS - elapsed)
      }
      setSwitchingHotel(false)
    }
  }
}
