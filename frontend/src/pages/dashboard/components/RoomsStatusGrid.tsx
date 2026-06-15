import type { Room } from '@/types'
import { ROOM_COLOR, ROOM_LABEL } from '../constants/roomStatusTheme'
import { roomStatusIcon, sortRoomsByNumber } from '../utils/roomUtils'

const ROOM_SKELETON_KEYS = Array.from({ length: 16 }, (_, i) => `room-skeleton-${i + 1}`)
const GRID_CLASS = 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-7 2xl:grid-cols-8 gap-2'

interface RoomsStatusGridProps {
  readonly loading: boolean
  readonly rooms: Room[]
  readonly onSelectRoom: (room: Room) => void
}

export default function RoomsStatusGrid({ loading, rooms, onSelectRoom }: RoomsStatusGridProps) {
  if (loading) {
    return (
      <div className={GRID_CLASS}>
        {ROOM_SKELETON_KEYS.map((key) => (
          <div key={key} className="aspect-[4/3] rounded-lg animate-pulse" style={{ background: 'var(--bg-input)' }} />
        ))}
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin habitaciones configuradas</p>
      </div>
    )
  }

  return (
    <div className={GRID_CLASS}>
      {sortRoomsByNumber(rooms).map((room) => {
        const bg = ROOM_COLOR[room.status] ?? '#94A3B8'
        const StatusIcon = roomStatusIcon(room.status)

        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelectRoom(room)}
            className="text-white rounded-lg p-1.5 aspect-[4/3] flex flex-col items-center justify-between shadow-sm transition-transform hover:scale-105 cursor-pointer"
            style={{ background: bg }}
            title={`Hab. ${room.number} — ${ROOM_LABEL[room.status]} (click para ver detalle)`}
          >
            <span className="self-end">
              {StatusIcon && <StatusIcon className="w-3.5 h-3.5 opacity-90" />}
            </span>
            <span className="font-bold text-sm leading-none">{room.number}</span>
            <span />
          </button>
        )
      })}
    </div>
  )
}
