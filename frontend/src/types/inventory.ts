import type { PaginatedPage } from './pagination'

export type InventoryCategoryType = 'consumable' | 'asset' | 'cleaning'

export interface InventoryCategory {
  id: string
  name: string
  type: InventoryCategoryType
  active: boolean
  created_at: string
  updated_at: string
}

export type InventoryTransactionType =
  | 'entry'
  | 'exit_to_minibar'
  | 'exit_to_housekeeping'
  | 'adjustment'
  | 'sale'

export interface InventoryTransaction {
  id: string
  inventory_item_id: string
  type: InventoryTransactionType
  quantity: number
  unit_price: string
  total_value: string
  performed_by: string
  destination_room_id: string | null
  destination_user_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  performed_by_user?: { id: string; name: string }
  destination_room?: { id: string; number: string } | null
  destination_user?: { id: string; name: string } | null
}

export type InventoryMovementType =
  | 'entry'
  | 'exit_to_minibar'
  | 'exit_to_housekeeping'
  | 'adjustment'
  | 'sale'
  | 'minibar_consumed'
  | 'minibar_damaged'
  | 'minibar_missing'
  | 'minibar_restock'
  | 'minibar_return'
  | 'minibar_catalog_entry'
  | 'minibar_catalog_adjustment'

export interface InventoryMovement {
  id: string
  source: 'inventory' | 'minibar_consumption' | 'minibar'
  type: InventoryMovementType
  item_name: string
  item_code: string | null
  item_presentation: string | null
  quantity: number
  unit_price: string | null
  total_value: string | null
  performed_by: string | null
  destination: string | null
  notes: string | null
  occurred_at: string
}

export type InventoryHistoryPage = PaginatedPage<InventoryMovement>

export interface InventoryItem {
  id: string
  category_id: string
  code: string
  name: string
  brand: string | null
  presentation: string | null
  unit: string
  cost_price: string
  sale_price: string | null
  current_stock: number
  min_stock_threshold: number
  expiry_date: string | null
  supplier: string | null
  invoice_number: string | null
  location: string | null
  active: boolean
  category?: InventoryCategory
  transactions?: InventoryTransaction[]
  created_at: string
  updated_at: string
}
