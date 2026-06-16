import { useMemo, useState, useEffect, useRef } from 'react'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SearchableCombobox } from '@/components/forms/SearchableCombobox'
import { useHotelStore } from '@/store/hotelStore'
import { useSwitchHotel } from '@/hooks/useSwitchHotel'

interface SidebarHotelSwitcherProps {
  readonly collapsed: boolean
}

export default function SidebarHotelSwitcher({ collapsed }: SidebarHotelSwitcherProps) {
  const hotels = useHotelStore((s) => s.hotels)
  const currentHotelId = useHotelStore((s) => s.currentHotelId)
  const canSwitchHotel = useHotelStore((s) => s.canSwitchHotel)
  const isSwitchingHotel = useHotelStore((s) => s.isSwitchingHotel)
  const switchHotel = useSwitchHotel()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const options = useMemo(
    () => hotels.map((hotel) => ({
      value: hotel.id,
      label: hotel.name,
      hint: hotel.city ?? undefined,
    })),
    [hotels],
  )

  const activeHotel = hotels.find((h) => h.id === currentHotelId)

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  useEffect(() => {
    if (!collapsed) setMenuOpen(false)
  }, [collapsed])

  if (!canSwitchHotel || hotels.length <= 1) return null

  const handleSelect = (hotelId: string) => {
    if (hotelId === currentHotelId || isSwitchingHotel) return
    setMenuOpen(false)
    switchHotel(hotelId).catch(() => {
      /* el overlay y el store ya reflejan el estado */
    })
  }

  if (collapsed) {
    return (
      <div ref={menuRef} className="relative px-2 pb-2 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={isSwitchingHotel}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label={`Cambiar hotel. Activo: ${activeHotel?.name ?? 'Hotel'}`}
          title={activeHotel?.name ?? 'Cambiar hotel'}
          className={cn(
            'flex h-9 w-9 mx-auto items-center justify-center rounded-lg transition-colors',
            'text-white hover:bg-white/10 disabled:opacity-60',
          )}
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <Building2 size={16} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div className="absolute left-full top-0 ml-2 z-50 w-[240px] p-2 rounded-lg border shadow-lg"
            style={{
              background: 'var(--sidebar-bg)',
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Cambiar hotel
            </p>
            <SearchableCombobox
              value={currentHotelId ?? ''}
              onChange={handleSelect}
              options={options}
              disabled={isSwitchingHotel}
              variant="sidebar"
              defaultOpen
              placeholder="Seleccionar hotel"
              searchPlaceholder="Buscar hotel…"
              ariaLabel="Seleccionar hotel activo"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-3 py-3 border-b border-white/10 shrink-0 space-y-1.5">
      <label
        htmlFor="sidebar-hotel-switcher"
        className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-1"
      >
        Cambiar hotel
      </label>
      <SearchableCombobox
        id="sidebar-hotel-switcher"
        value={currentHotelId ?? ''}
        onChange={handleSelect}
        options={options}
        disabled={isSwitchingHotel}
        variant="sidebar"
        placeholder="Seleccionar hotel"
        searchPlaceholder="Buscar hotel…"
        ariaLabel="Seleccionar hotel activo"
      />
    </div>
  )
}
