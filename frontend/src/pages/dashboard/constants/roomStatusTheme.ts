import type { RoomStatus } from '@/types'

export const ROOM_COLOR: Record<RoomStatus, string> = {
  available: '#22C55E',
  occupied: '#EF4444',
  reserved: '#F59E0B',
  cleaning: '#8B5CF6',
  maintenance: '#F97316',
  blocked: '#94A3B8',
}

export const ROOM_LABEL: Record<RoomStatus, string> = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  cleaning: 'Limpieza',
  maintenance: 'Mant.',
  blocked: 'Bloqueada',
}
