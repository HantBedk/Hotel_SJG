import { ROOM_LABEL, ROOM_STATUS_STYLE } from '../constants/roomStatusTheme'
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
      {LEGEND_STATUSES.map((status) => {
        const cfg = ROOM_STATUS_STYLE[status]
        return (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: cfg.color }}
              aria-hidden="true"
            />
            {ROOM_LABEL[status]}
          </span>
        )
      })}
    </div>
  )
}
