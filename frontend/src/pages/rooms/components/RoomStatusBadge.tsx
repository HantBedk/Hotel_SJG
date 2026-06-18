import type { RoomStatus } from '@/types'
import { ROOM_LABEL, ROOM_STATUS_STYLE } from '@/pages/dashboard/constants/roomStatusTheme'

const STATUS_CONFIG = Object.fromEntries(
  (Object.keys(ROOM_STATUS_STYLE) as RoomStatus[]).map((status) => [
    status,
    { label: ROOM_LABEL[status], ...ROOM_STATUS_STYLE[status] },
  ]),
) as Record<RoomStatus, { label: string; color: string; bg: string }>

interface RoomStatusBadgeProps {
  readonly status: RoomStatus
  readonly className?: string
}

export function RoomStatusBadge({ status, className }: RoomStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={className ?? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  )
}

export { STATUS_CONFIG }
