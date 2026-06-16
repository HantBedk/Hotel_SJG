import { ArrowLeftRight, LogIn, Check, Wrench } from 'lucide-react'
import type { Room } from '@/types'
import { RoomStatusBadge } from './RoomStatusBadge'
import { RoomFeatureList } from './RoomFeatureBadges'
import { cn } from '@/lib/cn'
import { formatCOP } from '@/lib/format'

interface Props {
  readonly room: Room
  readonly canEdit: boolean
  readonly onChangeStatus: (room: Room) => void
  readonly onCheckIn?: (room: Room) => void
  readonly isSelected?: boolean
  readonly onSelect?: (room: Room) => void
}

function formatFloorLabel(floor: number | null | undefined): string | null {
  if (floor == null) return null
  return `Piso ${floor}`
}

export function RoomCard({ room, canEdit, onChangeStatus, onCheckIn, isSelected, onSelect }: Props) {
  const isAvailable = room.status === 'available'
  const floorLabel = formatFloorLabel(room.floor)
  const price = Number.parseFloat(room.room_type.base_price)
  const hasOpenRepairs = (room.open_repair_orders_count ?? 0) > 0

  return (
    <article
      className={cn(
        'rounded-xl flex flex-col transition-all h-full',
        isSelected ? 'ring-2 shadow-md' : 'hover:shadow-md',
      )}
      style={{
        background: 'var(--bg-surface)',
        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
      }}
    >
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Fila superior: número + acciones */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Habitación
            </p>
            <p
              className="text-2xl font-bold leading-tight break-words"
              style={{ color: 'var(--text-primary)' }}
              title={`Habitación ${room.number}`}
            >
              {room.number}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <RoomStatusBadge status={room.status} />
            {isAvailable && onSelect && (
              <button
                type="button"
                onClick={() => onSelect(room)}
                title={isSelected ? 'Deseleccionar' : 'Seleccionar para check-in múltiple'}
                aria-pressed={isSelected}
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
                  isSelected ? 'border-transparent' : 'hover:opacity-80',
                )}
                style={{
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-default)',
                }}
              >
                {isSelected && <Check size={11} className="text-white" />}
              </button>
            )}
          </div>
        </div>

        {/* Tipo, piso, casa y precio — líneas separadas, sin truncar el número */}
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {room.room_type.name}
          </p>
          {(floorLabel || room.house?.name) && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {[floorLabel, room.house?.name].filter(Boolean).join(' · ')}
            </p>
          )}
          {!Number.isNaN(price) && (
            <p className="text-xs font-medium pt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {formatCOP(price)} / noche
            </p>
          )}
        </div>

        {/* Características */}
        <div
          className="rounded-lg px-3 py-2.5 space-y-1.5"
          style={{ background: 'var(--bg-muted)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Características
          </p>
          <RoomFeatureList features={room.features} />
        </div>

        {hasOpenRepairs && (
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg"
            style={{ background: '#FEF3C7', color: '#92400E' }}
          >
            <Wrench size={12} aria-hidden="true" />
            {room.open_repair_orders_count} orden{room.open_repair_orders_count === 1 ? '' : 'es'} de reparación
          </p>
        )}

        {room.notes && (
          <p className="text-xs italic line-clamp-2" style={{ color: 'var(--text-muted)' }} title={room.notes}>
            {room.notes}
          </p>
        )}
      </div>

      {canEdit && (
        <div
          className="flex gap-2 px-4 py-3 border-t"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {isAvailable && onCheckIn && (
            <button
              type="button"
              onClick={() => onCheckIn(room)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <LogIn size={13} />
              Check-in
            </button>
          )}
          <button
            type="button"
            onClick={() => onChangeStatus(room)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-opacity hover:opacity-90',
              isAvailable ? 'px-3' : 'flex-1',
            )}
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeftRight size={13} />
            {isAvailable ? 'Estado' : 'Cambiar estado'}
          </button>
        </div>
      )}
    </article>
  )
}
