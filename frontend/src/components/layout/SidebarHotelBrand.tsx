import { useEffect, useState } from 'react'
import { BedDouble, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useHotelStore } from '@/store/hotelStore'
import type { HotelSummary } from '@/types'

interface SidebarHotelBrandProps {
  readonly collapsed: boolean
}

function resolveDisplayedHotel(
  hotels: HotelSummary[],
  displayedId: string | null,
  currentHotelId: string | null,
): HotelSummary | undefined {
  if (displayedId) {
    return hotels.find((h) => h.id === displayedId)
  }
  if (currentHotelId) {
    return hotels.find((h) => h.id === currentHotelId)
  }
  return hotels[0]
}

/** Marca del hotel en sidebar: mantiene el nombre anterior durante el switch y crossfade al nuevo. */
export default function SidebarHotelBrand({ collapsed }: SidebarHotelBrandProps) {
  const currentHotelId = useHotelStore((s) => s.currentHotelId)
  const isSwitchingHotel = useHotelStore((s) => s.isSwitchingHotel)
  const hotels = useHotelStore((s) => s.hotels)

  const [displayedId, setDisplayedId] = useState<string | null>(currentHotelId)

  useEffect(() => {
    if (!isSwitchingHotel) {
      setDisplayedId(currentHotelId)
    }
  }, [isSwitchingHotel, currentHotelId])

  useEffect(() => {
    if (currentHotelId && displayedId === null) {
      setDisplayedId(currentHotelId)
    }
  }, [currentHotelId, displayedId])

  const hotel = resolveDisplayedHotel(hotels, displayedId, currentHotelId)
  const name = hotel?.name ?? 'Hotel Manager'

  return (
    <>
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
          'transition-opacity duration-300 ease-out',
          isSwitchingHotel ? 'opacity-60' : 'opacity-100',
        )}
        style={{ background: 'var(--color-primary)' }}
        aria-hidden="true"
      >
        {hotel?.logo_url ? (
          <img
            key={hotel.id}
            src={hotel.logo_url}
            alt=""
            className="w-full h-full object-contain sidebar-brand-fade-in"
          />
        ) : (
          <BedDouble key={hotel?.id ?? 'default'} size={16} className="text-white sidebar-brand-fade-in" />
        )}
      </div>

      {!collapsed && (
        <span
          key={hotel?.id ?? 'default'}
          className={cn(
            'font-semibold text-sm text-white truncate flex-1 sidebar-brand-fade-in',
            'transition-opacity duration-300 ease-out',
            isSwitchingHotel ? 'opacity-60' : 'opacity-100',
          )}
        >
          {name}
        </span>
      )}

      {!collapsed && isSwitchingHotel && (
        <Loader2
          size={14}
          className="flex-shrink-0 text-white/70 animate-spin"
          aria-hidden="true"
        />
      )}
    </>
  )
}
