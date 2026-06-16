import { ROOM_COLOR, ROOM_LABEL } from '../constants/roomStatusTheme'
import type { RoomStatus } from '@/types'

const LEGEND_STATUSES: RoomStatus[] = [
  'available',
  'occupied',
  'reserved',
  'cleaning',
  'maintenance',
]

export default function RoomStatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 shrink-0 border-t" style={{ borderColor: 'var(--border-default)' }}>
      {LEGEND_STATUSES.map((status) => (
        <span
          key={status}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: ROOM_COLOR[status] }}
            aria-hidden="true"
          />
          {ROOM_LABEL[status]}
        </span>
      ))}
    </div>
  )
}
