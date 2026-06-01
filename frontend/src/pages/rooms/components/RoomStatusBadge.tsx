import type { RoomStatus } from '@/types'

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  available:   { label: 'Disponible',   color: 'var(--status-available)',   bg: '#ECFDF5' },
  occupied:    { label: 'Ocupada',      color: 'var(--status-occupied)',    bg: '#FEF2F2' },
  reserved:    { label: 'Reservada',    color: 'var(--status-reserved)',    bg: '#FFFBEB' },
  cleaning:    { label: 'Limpieza',     color: 'var(--status-cleaning)',    bg: '#F5F3FF' },
  maintenance: { label: 'Mantenimiento',color: 'var(--status-maintenance)', bg: '#ECFEFF' },
  blocked:     { label: 'Bloqueada',    color: 'var(--status-blocked)',     bg: '#F9FAFB' },
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
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
