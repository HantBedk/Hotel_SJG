import { useHotelStore } from '@/store/hotelStore'

function buildHotelQueryKey(hotelId: string | null, parts: readonly unknown[]): unknown[] {
  return hotelId ? ['hotel', hotelId, ...parts] : ['hotel', ...parts]
}

/** Prefijo de hotel para invalidaciones (lee el store sin suscripción). */
export function hotelQueryKey(...parts: readonly unknown[]): unknown[] {
  return buildHotelQueryKey(useHotelStore.getState().currentHotelId, parts)
}

/** Clave reactiva: re-renderiza el componente cuando cambia el hotel activo. */
export function useHotelQueryKey(...parts: readonly unknown[]): unknown[] {
  const hotelId = useHotelStore((s) => s.currentHotelId)
  return buildHotelQueryKey(hotelId, parts)
}
