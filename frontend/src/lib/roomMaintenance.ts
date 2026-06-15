import type { RepairOrder, Room } from '@/types'

export function roomHasOpenMaintenanceOrder(room: Room, orders?: RepairOrder[]): boolean {
  if ((room.open_repair_orders_count ?? 0) > 0) return true
  return (orders ?? []).some((o) => o.status === 'pending' || o.status === 'in_progress')
}
