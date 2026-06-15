import {
  Sparkles, Wrench, XCircle, Calendar, Check,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardStats, Room, RoomStatus } from '@/types'

export function sortRoomsByNumber(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    const na = Number.parseInt(String(a.number), 10)
    const nb = Number.parseInt(String(b.number), 10)
    const aIsNum = !Number.isNaN(na)
    const bIsNum = !Number.isNaN(nb)
    if (aIsNum && bIsNum) return na - nb
    if (aIsNum) return -1
    if (bIsNum) return 1
    return String(a.number).localeCompare(String(b.number))
  })
}

export function roomStatusIcon(status: RoomStatus): LucideIcon | null {
  if (status === 'cleaning') return Sparkles
  if (status === 'maintenance') return Wrench
  if (status === 'blocked') return XCircle
  if (status === 'reserved') return Calendar
  if (status === 'occupied') return Check
  return null
}

export function occupancyCountForStatus(status: RoomStatus, stats: DashboardStats): number {
  if (status === 'available') return stats.available
  if (status === 'occupied') return stats.occupied
  if (status === 'cleaning') return stats.cleaning ?? 0
  return stats.rooms_by_status[status] ?? 0
}
