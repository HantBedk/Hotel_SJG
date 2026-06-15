import type { InventoryItem } from './inventory'

export type MinibarConsumptionType = 'consumed' | 'damaged' | 'missing'

export interface MinibarConsumption {
  id: string
  stay_id: string
  room_id: string
  product_name: string
  quantity: number
  type: MinibarConsumptionType
  unit_price: string
  total: string
  registered_at: string
  registered_by: string
  created_at: string
  updated_at: string
}

export interface MinibarItem {
  product_name: string
  room_id: string
  type: MinibarConsumptionType
  quantity: number
  unit_price: number
}

export interface MinibarProduct {
  id: string
  code: string | null
  name: string
  presentation: string | null
  inventory_item_id: string | null
  sale_price: string
  cost_price: string
  damage_price: string | null
  stock_quantity: number
  expiration_date: string | null
  description: string | null
  active: boolean
  inventory_item?: InventoryItem | null
  total_stock?: number
  created_at: string
  updated_at: string
}

export interface RoomMinibar {
  id: string
  room_id: string
  minibar_product_id: string
  quantity: number
  last_restocked_at: string | null
  restocked_by: string | null
  product?: MinibarProduct
  restocked_by_user?: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export interface Minibar {
  id: string
  room_id: string
  name: string | null
  notes: string | null
  active: boolean
  room?: { id: string; number: string }
  items?: RoomMinibar[]
  created_at: string
  updated_at: string
}
