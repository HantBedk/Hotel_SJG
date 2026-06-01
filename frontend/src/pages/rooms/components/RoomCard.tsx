import { ArrowLeftRight, LogIn } from 'lucide-react'
import type { Room } from '@/types'
import { RoomStatusBadge } from './RoomStatusBadge'

interface Props {
  room: Room
  canEdit: boolean
  onChangeStatus: (room: Room) => void
  onCheckIn?: (room: Room) => void
}

export function RoomCard({ room, canEdit, onChangeStatus, onCheckIn }: Props) {
  const isAvailable = room.status === 'available'

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      {/* Number + type */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {room.number}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {room.room_type.name}
            {room.floor != null && ` · Piso ${room.floor}`}
          </p>
        </div>
        <RoomStatusBadge status={room.status} />
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
              onClick={() => onCheckIn(room)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <LogIn size={13} />
              Check-in
            </button>
          )}
          <button
            onClick={() => onChangeStatus(room)}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
              flex: isAvailable ? '0 0 auto' : '1 1 0',
              paddingLeft: '10px',
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
