import type { Room } from '@/types'
import { BedDouble, Wrench } from 'lucide-react'
import { ROOM_LABEL, roomStatusBorderColor, roomStatusColor, roomStatusSoftBg } from '../constants/roomStatusTheme'
import { roomStatusIcon, sortRoomsByNumber } from '../utils/roomUtils'
import { RoomStatusBadge } from '@/pages/rooms/components/RoomStatusBadge'
import { cn } from '@/lib/cn'

export type RoomPlanDensity = 'compact' | 'comfort'

const COMPACT_SKELETON_KEYS = Array.from({ length: 48 }, (_, i) => `room-skeleton-${i + 1}`)
const COMFORT_SKELETON_KEYS = Array.from({ length: 12 }, (_, i) => `room-skeleton-comfort-${i + 1}`)

const COMPACT_GRID =
  'grid gap-1.5 grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(3rem,1fr))]'

const COMFORT_GRID =
  'grid gap-2 grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))]'

interface RoomsStatusGridProps {
  readonly loading: boolean
  readonly rooms: Room[]
  readonly density?: RoomPlanDensity
  readonly onSelectRoom: (room: Room) => void
  readonly hasFilters?: boolean
}

function floorLine(floor: number | null | undefined): string {
  if (floor == null) return ''
  return `\nPiso ${floor}`
}

function roomTileTitle(room: Room): string {
  const typeName = room.room_type?.name ?? 'Sin tipo'
  const floor = floorLine(room.floor)
  const house = room.house?.name ? `\n${room.house.name}` : ''
  const features = room.features?.length
    ? `\nCaracterísticas: ${room.features.map((f) => f.name).join(', ')}`
    : ''
  const repairs = (room.open_repair_orders_count ?? 0) > 0
    ? `\n${room.open_repair_orders_count} orden(es) de reparación`
    : ''
  return `Habitación ${room.number} — ${typeName} — ${ROOM_LABEL[room.status]}${floor}${house}${features}${repairs}`
}

interface RoomCompactTileProps {
  readonly room: Room
  readonly onSelect: (room: Room) => void
}

function RoomCompactTile({ room, onSelect }: RoomCompactTileProps) {
  const statusColor = roomStatusColor(room.status)
  const StatusIcon = roomStatusIcon(room.status)
  const hasRepairs = (room.open_repair_orders_count ?? 0) > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={cn(
        'group relative flex items-center justify-center rounded-md',
        'border transition-all hover:brightness-95 hover:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1',
        'min-h-[2.25rem] sm:min-h-[2.5rem] px-0.5',
      )}
      style={{
        background: roomStatusSoftBg(room.status),
        borderColor: roomStatusBorderColor(room.status),
        boxShadow: `inset 3px 0 0 ${statusColor}`,
      }}
      title={roomTileTitle(room)}
      aria-label={`Habitación ${room.number}, ${ROOM_LABEL[room.status]}`}
    >
      <span
        className="text-[11px] sm:text-xs font-bold tabular-nums leading-none truncate max-w-full px-0.5"
        style={{ color: statusColor }}
      >
        {room.number}
      </span>

      {StatusIcon && (
        <StatusIcon
          className="absolute top-0.5 right-0.5 w-2.5 h-2.5 opacity-70"
          style={{ color: statusColor }}
          aria-hidden="true"
        />
      )}

      {hasRepairs && (
        <Wrench
          className="absolute bottom-0.5 left-0.5 w-2 h-2 opacity-80"
          style={{ color: '#D97706' }}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

interface RoomComfortTileProps {
  readonly room: Room
  readonly onSelect: (room: Room) => void
}

function RoomComfortTile({ room, onSelect }: RoomComfortTileProps) {
  const statusColor = roomStatusColor(room.status)
  const StatusIcon = roomStatusIcon(room.status)
  const hasRepairs = (room.open_repair_orders_count ?? 0) > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={cn(
        'group relative rounded-lg overflow-hidden text-left transition-all',
        'border hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        'min-h-[4.5rem]',
      )}
      style={{
        background: roomStatusSoftBg(room.status),
        borderColor: roomStatusBorderColor(room.status),
        boxShadow: `inset 0 -3px 0 ${statusColor}`,
      }}
      title={roomTileTitle(room)}
      aria-label={`Habitación ${room.number}, ${ROOM_LABEL[room.status]}`}
    >
      <div className="p-2 flex flex-col gap-1 h-full">
        <div className="flex items-start justify-between gap-1">
          <span
            className="text-sm font-bold leading-none tabular-nums truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {room.number}
          </span>
          {StatusIcon && (
            <StatusIcon
              className="w-3.5 h-3.5 shrink-0 opacity-80"
              style={{ color: statusColor }}
              aria-hidden="true"
            />
          )}
        </div>
        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
          {room.room_type?.name ?? '—'}
        </p>
        <RoomStatusBadge
          status={room.status}
          className="inline-flex items-center px-1.5 py-0 rounded-full text-[9px] font-semibold mt-auto self-start"
        />
        {hasRepairs && (
          <Wrench size={10} className="absolute bottom-1.5 right-1.5" style={{ color: '#D97706' }} aria-hidden="true" />
        )}
      </div>
    </button>
  )
}

interface RoomPlanGridProps {
  readonly rooms: Room[]
  readonly density: RoomPlanDensity
  readonly onSelectRoom: (room: Room) => void
}

function RoomPlanGrid({ rooms, density, onSelectRoom }: RoomPlanGridProps) {
  const gridClass = density === 'compact' ? COMPACT_GRID : COMFORT_GRID
  const Tile = density === 'compact' ? RoomCompactTile : RoomComfortTile

  return (
    <div className={gridClass}>
      {sortRoomsByNumber(rooms).map((room) => (
        <Tile key={room.id} room={room} onSelect={onSelectRoom} />
      ))}
    </div>
  )
}

function RoomsStatusSkeleton({ density }: { readonly density: RoomPlanDensity }) {
  const keys = density === 'compact' ? COMPACT_SKELETON_KEYS : COMFORT_SKELETON_KEYS
  const gridClass = density === 'compact' ? COMPACT_GRID : COMFORT_GRID
  const minH = density === 'compact' ? 'min-h-[2.25rem] sm:min-h-[2.5rem]' : 'min-h-[4.5rem]'

  return (
    <div className={gridClass}>
      {keys.map((key) => (
        <div key={key} className={cn('rounded-md animate-pulse', minH)} style={{ background: 'var(--bg-input)' }} />
      ))}
    </div>
  )
}

function RoomsStatusEmpty({ hasFilters }: { readonly hasFilters?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed"
      style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
    >
      <BedDouble size={28} className="mb-2 opacity-60" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {hasFilters ? 'Sin habitaciones con ese filtro' : 'Sin habitaciones configuradas'}
      </p>
      <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {hasFilters
          ? 'Prueba otro estado o limpia la búsqueda.'
          : 'Registra habitaciones en Configuración → Habitaciones.'}
      </p>
    </div>
  )
}

export default function RoomsStatusGrid({
  loading,
  rooms,
  density = 'compact',
  onSelectRoom,
  hasFilters,
}: RoomsStatusGridProps) {
  const sortedRooms = sortRoomsByNumber(rooms)

  if (loading) {
    return <RoomsStatusSkeleton density={density} />
  }

  if (rooms.length === 0) {
    return <RoomsStatusEmpty hasFilters={hasFilters} />
  }

  return (
    <RoomPlanGrid rooms={sortedRooms} density={density} onSelectRoom={onSelectRoom} />
  )
}
