import { ArrowLeftRight, LogIn, Check } from 'lucide-react'
import type { Room } from '@/types'
import { RoomStatusBadge } from './RoomStatusBadge'
import { cn } from '@/lib/cn'

interface Props {
  readonly room: Room
  readonly canEdit: boolean
  readonly onChangeStatus: (room: Room) => void
  readonly onCheckIn?: (room: Room) => void
  readonly isSelected?: boolean
  readonly onSelect?: (room: Room) => void
}

export function RoomCard({ room, canEdit, onChangeStatus, onCheckIn, isSelected, onSelect }: Props) {
  const isAvailable = room.status === 'available'

  return (
    <div
      className={cn(
        'rounded-xl p-4 flex flex-col gap-3 transition-all',
        isSelected
          ? 'ring-2 shadow-md'
          : 'hover:shadow-md',
      )}
      style={{
        background:    'var(--bg-surface)',
        border:        isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
      }}
    >
      {/* Number + type + selection checkbox */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {room.number}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {room.room_type.name}
            {room.floor != null && ` · Piso ${room.floor}`}
            {room.house && ` · ${room.house.name}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Selection toggle — only for available rooms when onSelect provided */}
          {isAvailable && onSelect && (
            <button
              type="button"
              onClick={() => onSelect(room)}
              title={isSelected ? 'Deseleccionar' : 'Seleccionar para check-in múltiple'}
              className={cn(
                'w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0',
                isSelected
                  ? 'border-transparent'
                  : 'hover:opacity-80',
              )}
              style={{
                background:   isSelected ? 'var(--color-primary)' : 'transparent',
                borderColor:  isSelected ? 'var(--color-primary)' : 'var(--border-default)',
              }}
            >
              {isSelected && <Check size={11} className="text-white" />}
            </button>
          )}
          <RoomStatusBadge status={room.status} />
        </div>
      </div>

      {/* Notes */}
      {room.notes && (
        <p className="text-xs italic truncate" style={{ color: 'var(--text-muted)' }}>
          {room.notes}
        </p>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2">
          {isAvailable && onCheckIn && (
            <button
              type="button"
              onClick={() => onCheckIn(room)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <LogIn size={13} />
              Check-in
            </button>
          )}
          <button
            type="button"
            onClick={() => onChangeStatus(room)}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-default)',
              color:       'var(--text-secondary)',
              flex:        isAvailable ? '0 0 auto' : '1 1 0',
              paddingLeft:  '10px',
              paddingRight: '10px',
            }}
          >
            <ArrowLeftRight size={13} />
            {!isAvailable && 'Cambiar estado'}
          </button>
        </div>
      )}
    </div>
  )
}
