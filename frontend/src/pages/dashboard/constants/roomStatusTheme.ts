import type { RoomStatus } from '@/types'

export const ROOM_LABEL: Record<RoomStatus, string> = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  cleaning: 'Limpieza',
  maintenance: 'Mant.',
  blocked: 'Bloqueada',
}

/** Colores alineados con tokens globales (--status-*). */
export const ROOM_STATUS_STYLE: Record<RoomStatus, { color: string; bg: string }> = {
  available:   { color: 'var(--status-available)',   bg: 'var(--status-available-soft)' },
  occupied:    { color: 'var(--status-occupied)',    bg: 'var(--status-occupied-soft)' },
  reserved:    { color: 'var(--status-reserved)',    bg: 'var(--status-warning-soft)' },
  cleaning:    { color: 'var(--status-cleaning)',    bg: 'var(--status-cleaning-soft)' },
  maintenance: { color: 'var(--status-maintenance)', bg: 'var(--status-maintenance-soft)' },
  blocked:     { color: 'var(--status-blocked)',     bg: 'var(--status-blocked-soft)' },
}

export const ROOM_COLOR: Record<RoomStatus, string> = {
  available: ROOM_STATUS_STYLE.available.color,
  occupied: ROOM_STATUS_STYLE.occupied.color,
  reserved: ROOM_STATUS_STYLE.reserved.color,
  cleaning: ROOM_STATUS_STYLE.cleaning.color,
  maintenance: ROOM_STATUS_STYLE.maintenance.color,
  blocked: ROOM_STATUS_STYLE.blocked.color,
}

export function roomStatusColor(status: RoomStatus): string {
  return ROOM_STATUS_STYLE[status]?.color ?? 'var(--status-blocked)'
}

export function roomStatusSoftBg(status: RoomStatus): string {
  return ROOM_STATUS_STYLE[status]?.bg ?? 'var(--bg-muted)'
}

export function roomStatusBorderColor(status: RoomStatus): string {
  return `color-mix(in srgb, ${roomStatusColor(status)} 33%, transparent)`
}
