import type { RoomStatus } from './room'

export interface DashboardStats {
  rooms_by_status: Record<RoomStatus, number>
  total_rooms: number
  occupied: number
  available: number
  cleaning: number
  checkins_today: number
  active_stays: number
  pending_balance: number
  today_room_revenue: number
  inventory_alerts?: {
    low_stock: number
    expiring: number
    maintenances_soon: number
    total: number
  }
}
