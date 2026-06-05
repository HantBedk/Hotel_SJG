import api from '@/lib/axios'
import type {
  Asset,
  AssetMaintenance,
  InventoryCategory,
  InventoryHistoryPage,
  InventoryItem,
  InventoryTransaction,
  Minibar,
  MinibarProduct,
  RepairOrder,
  RoomMinibar,
} from '@/types'

// ── Categories ────────────────────────────────────────────────────────────────

export const getCategoriesApi = async (): Promise<InventoryCategory[]> => {
  const res = await api.get('/inventory/categories')
  return res.data.data
}

export const createCategoryApi = async (data: { name: string; type: string }): Promise<InventoryCategory> => {
  const res = await api.post('/inventory/categories', data)
  return res.data.data
}

// ── Items ─────────────────────────────────────────────────────────────────────

export interface ItemFilters {
  category_id?: string
  search?: string
  low_stock?: boolean
  min_stock_below?: number
  expiring_in_days?: number
  page?: number
  per_page?: number
}

export const getItemsApi = async (filters?: ItemFilters): Promise<{ data: InventoryItem[]; meta: unknown }> => {
  const res = await api.get('/inventory/items', { params: filters })
  return res.data.data
}

export const getItemApi = async (id: string): Promise<InventoryItem> => {
  const res = await api.get(`/inventory/items/${id}`)
  return res.data.data
}

export const createItemApi = async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
  const res = await api.post('/inventory/items', data)
  return res.data.data
}

export const updateItemApi = async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
  const res = await api.put(`/inventory/items/${id}`, data)
  return res.data.data
}

export const deleteItemApi = async (id: string): Promise<void> => {
  await api.delete(`/inventory/items/${id}`)
}

export const restockItemApi = async (
  id: string,
  data: { quantity: number; unit_price?: number; notes?: string }
): Promise<InventoryItem> => {
  const res = await api.post(`/inventory/items/${id}/restock`, data)
  return res.data.data
}

export const adjustStockApi = async (
  id: string,
  data: { new_stock: number; notes?: string }
): Promise<InventoryItem> => {
  const res = await api.post(`/inventory/items/${id}/adjust`, data)
  return res.data.data
}

export const deliverItemApi = async (
  id: string,
  data: { quantity: number; destination_user_id: string; notes?: string }
): Promise<InventoryItem> => {
  const res = await api.post(`/inventory/items/${id}/deliver`, data)
  return res.data.data
}

export const getItemTransactionsApi = async (
  id: string
): Promise<{ data: InventoryTransaction[]; meta: unknown }> => {
  const res = await api.get(`/inventory/items/${id}/transactions`)
  return res.data.data
}

// ── Minibar products ──────────────────────────────────────────────────────────

export const getMinibarProductsApi = async (): Promise<MinibarProduct[]> => {
  const res = await api.get('/inventory/minibar/products')
  return res.data.data
}

export const createMinibarProductApi = async (data: Partial<MinibarProduct>): Promise<MinibarProduct> => {
  const res = await api.post('/inventory/minibar/products', data)
  return res.data.data
}

export const updateMinibarProductApi = async (
  id: string,
  data: Partial<MinibarProduct>
): Promise<MinibarProduct> => {
  const res = await api.put(`/inventory/minibar/products/${id}`, data)
  return res.data.data
}

export const deleteMinibarProductApi = async (id: string): Promise<void> => {
  await api.delete(`/inventory/minibar/products/${id}`)
}

export const getRoomMinibarsApi = async (room_id: string): Promise<RoomMinibar[]> => {
  const res = await api.get('/inventory/minibar/room-minibars', { params: { room_id } })
  return res.data.data
}

export const restockRoomMinibarApi = async (data: {
  room_id: string
  minibar_product_id: string
  quantity: number
}): Promise<void> => {
  await api.post('/inventory/minibar/restock-room', data)
}

export const returnFromRoomMinibarApi = async (data: {
  room_id: string
  minibar_product_id: string
  quantity: number
}): Promise<void> => {
  await api.post('/inventory/minibar/return-from-room', data)
}

// ── Minibars (1 por habitación) ──────────────────────────────────────────────

export const getMinibarsApi = async (): Promise<Minibar[]> => {
  const res = await api.get('/inventory/minibar/minibars')
  return res.data.data
}

export const createMinibarApi = async (data: {
  room_id: string
  name?: string | null
  notes?: string | null
}): Promise<Minibar> => {
  const res = await api.post('/inventory/minibar/minibars', data)
  return res.data.data
}

export const updateMinibarApi = async (
  id: string,
  data: Partial<Pick<Minibar, 'name' | 'notes' | 'active'>>,
): Promise<Minibar> => {
  const res = await api.put(`/inventory/minibar/minibars/${id}`, data)
  return res.data.data
}

export const deleteMinibarApi = async (id: string): Promise<void> => {
  await api.delete(`/inventory/minibar/minibars/${id}`)
}

// ── Assets ────────────────────────────────────────────────────────────────────

export const getAssetsApi = async (filters?: {
  status?: string
  search?: string
  page?: number
  per_page?: number
}): Promise<{ data: Asset[]; meta: unknown }> => {
  const res = await api.get('/inventory/assets', { params: filters })
  return res.data.data
}

export const createAssetApi = async (data: Partial<Asset>): Promise<Asset> => {
  const res = await api.post('/inventory/assets', data)
  return res.data.data
}

export const updateAssetApi = async (id: string, data: Partial<Asset>): Promise<Asset> => {
  const res = await api.put(`/inventory/assets/${id}`, data)
  return res.data.data
}

export const retireAssetApi = async (id: string): Promise<void> => {
  await api.delete(`/inventory/assets/${id}`)
}

// ── Maintenances ──────────────────────────────────────────────────────────────

export const getMaintenancesApi = async (filters?: {
  status?: string
  asset_id?: string
  page?: number
  per_page?: number
}): Promise<{ data: AssetMaintenance[]; meta: unknown }> => {
  const res = await api.get('/inventory/maintenances', { params: filters })
  return res.data.data
}

export const addMaintenanceApi = async (
  assetId: string,
  data: {
    scheduled_date: string
    description: string
    technician_id?: string
    next_maintenance_date?: string
  }
): Promise<AssetMaintenance> => {
  const res = await api.post(`/inventory/assets/${assetId}/maintenance`, data)
  return res.data.data
}

export const completeMaintenanceApi = async (
  id: string,
  data: {
    completed_date?: string
    cost?: number
    notes?: string
    next_maintenance_date?: string
  }
): Promise<AssetMaintenance> => {
  const res = await api.patch(`/inventory/maintenance/${id}/complete`, data)
  return res.data.data
}

// ── Repair orders ─────────────────────────────────────────────────────────────

export const getRepairOrdersApi = async (filters?: {
  status?: string
  page?: number
  per_page?: number
}): Promise<{ data: RepairOrder[]; meta: unknown }> => {
  const res = await api.get('/inventory/repair-orders', { params: filters })
  return res.data.data
}

export const createRepairOrderApi = async (data: {
  asset_id?: string
  room_id?: string
  description: string
}): Promise<RepairOrder> => {
  const res = await api.post('/inventory/repair-orders', data)
  return res.data.data
}

export const assignRepairOrderApi = async (id: string, assigned_to: string): Promise<RepairOrder> => {
  const res = await api.patch(`/inventory/repair-orders/${id}/assign`, { assigned_to })
  return res.data.data
}

export const closeRepairOrderApi = async (
  id: string,
  data: { cost?: number; notes?: string }
): Promise<RepairOrder> => {
  const res = await api.patch(`/inventory/repair-orders/${id}/close`, data)
  return res.data.data
}

// ── Inventory history (admin only) ────────────────────────────────────────────

export interface HistoryFilters {
  source?: 'all' | 'inventory' | 'minibar'
  search?: string
  date_from?: string
  date_to?: string
  page?: number
}

export const getInventoryHistoryApi = async (
  filters?: HistoryFilters
): Promise<InventoryHistoryPage> => {
  const res = await api.get('/inventory/history', { params: filters })
  return res.data.data
}

export const getLowStockThresholdApi = async (): Promise<{ threshold: number | null }> => {
  const res = await api.get('/inventory/low-stock-threshold')
  return res.data.data
}

export const setLowStockThresholdApi = async (threshold: number): Promise<{ threshold: number }> => {
  const res = await api.post('/inventory/low-stock-threshold', { threshold })
  return res.data.data
}
