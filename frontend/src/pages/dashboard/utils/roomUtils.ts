import {
  Sparkles, Wrench, XCircle, Calendar, Check,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardStats, Room, RoomStatus } from '@/types'

export interface RoomPlanGroup {
  readonly key: string
  readonly label: string
  readonly rooms: Room[]
}

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

function floorGroupKey(floor: number | null | undefined): string {
  if (floor == null) return 'f:none'
  return `f:${floor}`
}

function floorGroupLabel(key: string): string {
  if (key === 'f:none') return 'Sin piso'
  return `Piso ${key.slice(2)}`
}

function sortFloorGroupKeys(a: string, b: string): number {
  if (a === 'f:none') return 1
  if (b === 'f:none') return -1
  return Number.parseInt(a.slice(2), 10) - Number.parseInt(b.slice(2), 10)
}

function groupSortedRoomsByFloor(sorted: Room[]): RoomPlanGroup[] {
  const byFloor = new Map<string, Room[]>()

  for (const room of sorted) {
    const key = floorGroupKey(room.floor)
    const bucket = byFloor.get(key) ?? []
    bucket.push(room)
    byFloor.set(key, bucket)
  }

  return [...byFloor.keys()]
    .sort(sortFloorGroupKeys)
    .map((key) => ({
      key,
      label: floorGroupLabel(key),
      rooms: byFloor.get(key) ?? [],
    }))
}

function groupSortedRoomsByHouseAndFloor(sorted: Room[]): RoomPlanGroup[] {
  const byHouse = new Map<string, Room[]>()

  for (const room of sorted) {
    const houseKey = room.house_id ?? 'h:none'
    const bucket = byHouse.get(houseKey) ?? []
    bucket.push(room)
    byHouse.set(houseKey, bucket)
  }

  const groups: RoomPlanGroup[] = []

  for (const [houseKey, houseRooms] of byHouse) {
    const houseName = houseRooms[0]?.house?.name ?? 'Sin casa'
    const floorGroups = groupSortedRoomsByFloor(houseRooms)

    if (floorGroups.length === 1 && floorGroups[0].key === 'f:none') {
      groups.push({
        key: houseKey,
        label: houseName,
        rooms: floorGroups[0].rooms,
      })
      continue
    }

    for (const floorGroup of floorGroups) {
      groups.push({
        key: `${houseKey}-${floorGroup.key}`,
        label: `${houseName} · ${floorGroup.label}`,
        rooms: floorGroup.rooms,
      })
    }
  }

  return groups
}

/** Agrupa habitaciones por casa y/o piso cuando aporta contexto al plano. */
export function buildRoomPlanGroups(rooms: Room[]): RoomPlanGroup[] {
  const sorted = sortRoomsByNumber(rooms)
  if (sorted.length === 0) return []

  const houseIds = new Set(sorted.map((room) => room.house_id ?? 'none'))
  const floorKeys = new Set(sorted.map((room) => floorGroupKey(room.floor)))

  if (houseIds.size > 1) {
    return groupSortedRoomsByHouseAndFloor(sorted)
  }

  if (floorKeys.size > 1) {
    return groupSortedRoomsByFloor(sorted)
  }

  return [{ key: 'all', label: '', rooms: sorted }]
}

export function occupancyCountForStatus(status: RoomStatus, stats: DashboardStats): number {
  if (status === 'available') return stats.available
  if (status === 'occupied') return stats.occupied
  if (status === 'cleaning') return stats.cleaning ?? 0
  return stats.rooms_by_status[status] ?? 0
}
