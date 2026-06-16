import { LayoutGrid, Rows3, Search, X } from 'lucide-react'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { cn } from '@/lib/cn'
import type { Room, RoomStatus } from '@/types'
import type { RoomPlanDensity } from './RoomsStatusGrid'

export type RoomGridFilter = RoomStatus | 'all'

const GRID_FILTER_OPTIONS: readonly { value: RoomGridFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'available', label: 'Disponibles' },
  { value: 'occupied', label: 'Ocupadas' },
  { value: 'reserved', label: 'Reservadas' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'maintenance', label: 'Mantenimiento' },
]

interface DashboardRoomFiltersProps {
  readonly search: string
  readonly filter: RoomGridFilter
  readonly density: RoomPlanDensity
  readonly total: number
  readonly filtered: number
  readonly onSearchChange: (value: string) => void
  readonly onFilterChange: (value: RoomGridFilter) => void
  readonly onDensityChange: (value: RoomPlanDensity) => void
}

export function DashboardRoomFilters({
  search,
  filter,
  density,
  total,
  filtered,
  onSearchChange,
  onFilterChange,
  onDensityChange,
}: DashboardRoomFiltersProps) {
  return (
    <div className="space-y-2.5 shrink-0">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar número, piso o tipo…"
            aria-label="Buscar habitación en el plano"
            className={cn(personInputClass, 'pl-9 pr-8 py-2 text-sm')}
            style={personInputStyle}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <fieldset
          className="flex shrink-0 rounded-lg p-0.5 border self-start m-0 min-w-0"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
        >
          <legend className="sr-only">Densidad del plano</legend>
          <button
            type="button"
            onClick={() => onDensityChange('compact')}
            aria-pressed={density === 'compact'}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors',
              density === 'compact' ? 'shadow-sm' : 'hover:opacity-80',
            )}
            style={{
              background: density === 'compact' ? 'var(--bg-surface)' : 'transparent',
              color: density === 'compact' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            <LayoutGrid size={13} aria-hidden="true" />
            Compacto
          </button>
          <button
            type="button"
            onClick={() => onDensityChange('comfort')}
            aria-pressed={density === 'comfort'}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors',
              density === 'comfort' ? 'shadow-sm' : 'hover:opacity-80',
            )}
            style={{
              background: density === 'comfort' ? 'var(--bg-surface)' : 'transparent',
              color: density === 'comfort' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            <Rows3 size={13} aria-hidden="true" />
            Detalle
          </button>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 overflow-x-auto max-w-full pb-0.5">
          {GRID_FILTER_OPTIONS.map(({ value, label }) => {
            const active = filter === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange(value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                  active ? 'border-transparent' : 'hover:opacity-80',
                )}
                style={{
                  background: active ? 'var(--color-primary-light)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  borderColor: active ? 'transparent' : 'var(--border-default)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {filtered} / {total}
        </span>
      </div>
    </div>
  )
}

function floorSearchToken(floor: number | null | undefined): string {
  if (floor == null) return ''
  return String(floor)
}

export function filterDashboardRooms(
  rooms: Room[],
  filter: RoomGridFilter,
  search: string,
): Room[] {
  const term = search.trim().toLowerCase()

  return rooms.filter((room) => {
    if (filter !== 'all' && room.status !== filter) return false
    if (!term) return true

    const haystack = [
      room.number,
      room.room_type?.name ?? '',
      floorSearchToken(room.floor),
    ].join(' ').toLowerCase()

    return haystack.includes(term)
  })
}
