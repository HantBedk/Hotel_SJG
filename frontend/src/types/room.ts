import type { House } from './house'

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'cleaning'
  | 'maintenance'
  | 'blocked'

export interface RoomType {
  id: string
  name: string
  description: string | null
  base_price: string
  max_occupancy: number
  amenities: string[] | null
}

export interface RoomFeature {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface Room {
  id: string
  hotel_id: string
  room_type_id: string
  house_id: string | null
  number: string
  floor: number | null
  status: RoomStatus
  notes: string | null
  is_active: boolean
  room_type: RoomType
  house?: House | null
  features?: RoomFeature[]
  open_repair_orders_count?: number
  created_at: string
  updated_at: string
}
