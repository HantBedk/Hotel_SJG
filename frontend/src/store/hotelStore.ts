import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HotelSummary } from '@/types'

const HOTEL_STORAGE_KEY = 'hotel-sjg-tenant'

export interface HotelAuthPayload {
  hotels: HotelSummary[]
  can_switch_hotel: boolean
  current_hotel_id: string | null
}

interface HotelPersistedState {
  currentHotelId: string | null
}

interface HotelState extends HotelPersistedState {
  hotels: HotelSummary[]
  canSwitchHotel: boolean
  isSwitchingHotel: boolean
  setFromAuth: (payload: HotelAuthPayload) => void
  setCurrentHotel: (id: string) => void
  setSwitchingHotel: (switching: boolean) => void
  reset: () => void
}

function resolveCurrentHotelId(
  storedId: string | null,
  hotels: HotelSummary[],
  authHotelId: string | null,
): string | null {
  if (storedId && hotels.some((hotel) => hotel.id === storedId)) {
    return storedId
  }
  if (authHotelId) return authHotelId
  return hotels.at(0)?.id ?? null
}

function hotelExists(hotels: HotelSummary[], id: string): boolean {
  return hotels.some((hotel) => hotel.id === id)
}

export const useHotelStore = create<HotelState>()(
  persist(
    (set, get) => ({
      currentHotelId: null,
      hotels: [],
      canSwitchHotel: false,
      isSwitchingHotel: false,

      setFromAuth: ({ hotels, can_switch_hotel, current_hotel_id }) => {
        set({
          hotels,
          canSwitchHotel: can_switch_hotel,
          currentHotelId: resolveCurrentHotelId(get().currentHotelId, hotels, current_hotel_id),
        })
      },

      setCurrentHotel: (id) => {
        if (hotelExists(get().hotels, id)) {
          set({ currentHotelId: id })
        }
      },

      setSwitchingHotel: (switching) => set({ isSwitchingHotel: switching }),

      reset: () => set({ currentHotelId: null, hotels: [], canSwitchHotel: false, isSwitchingHotel: false }),
    }),
    {
      name: HOTEL_STORAGE_KEY,
      partialize: (state): HotelPersistedState => ({
        currentHotelId: state.currentHotelId,
      }),
    },
  ),
)
