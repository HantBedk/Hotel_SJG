import api from '@/lib/axios'
import type {
  Asset,
  AssetMaintenance,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  MinibarProduct,
  RepairOrder,
  RoomMinibar,
} from '@/types'

// ── Categories ────────────────────────────────────────────────────────────────

export const getCategoriesApi = async (): Promise<InventoryCategory[]> => {
  const res = await api.get('/v1/inventory/categories')
  return res.data.data
}

export const createCategoryApi = async (data: { name: string; type: string }): Promise<InventoryCategory> => {
  const res = await api.post('/v1/inventory/categories', data)
  return res.data.data
}

// ── Items ─────────────────────────────────────────────────────────────────────

export interface ItemFilters {
  category_id?: string
  search?: string
  low_stock?: boolean
  expiring_in_days?: number
  page?: number
}

export const getItemsApi = async (filters?: ItemFilters): Promise<{ data: InventoryItem[]; meta: unknown }> => {
  const res = await api.get('/v1/inventory/items', { params: filters })
  return res.data.data
}

export const getItemApi = async (id: string): Promise<InventoryItem> => {
  const res = await api.get(`/v1/inventory/items/${id}`)
  return res.data.data
}

export const createItemApi = async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
  const res = await api.post('/v1/inventory/items', data)
  return res.data.data
}

export const updateItemApi = async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
  const res = await api.put(`/v1/inventory/items/${id}`, data)
  return res.data.data
}

export const deleteItemApi = async (id: string): Promise<void> => {
  await api.delete(`/v1/inventory/items/${id}`)
}

export const restockItemApi = async (
  id: string,
  data: { quantity: number; unit_price?: number; notes?: string }
): Promise<InventoryItem> => {
  const res = await api.post(`/v1/inventory/items/${id}/restock`, data)
  return res.data.data
}

export const adjustStockApi = async (
  id: string,
  data: { new_stock: number; notes?: string }
): Promise<InventoryItem> => {
  const res = await api.post(`/v1/inventory/items/${id}/adjust`, data)
  return res.data.data
}

export const deliverItemApi = async (
  id: string,
  data: { quantity: number; destination_user_id: string; notes?: string }
): Promise<InventoryItem> => {
  const res = await api.post(`/v1/inventory/items/${id}/deliver`, data)
  return res.data.data
}

export const getItemTransactionsApi = async (
  id: string
): Promise<{ data: InventoryTransaction[]; meta: unknown }> => {
  const res = await api.get(`/v1/inventory/items/${id}/transactions`)
  return res.data.data
}

// ── Minibar products ──────────────────────────────────────────────────────────

export const getMinibarProductsApi = async (): Promise<MinibarProduct[]> => {
  const res = await api.get('/v1/inventory/minibar/products')
  return res.data.data
}

export const createMinibarProductApi = async (data: Partial<MinibarProduct>): Promise<MinibarProduct> => {
  const res = await api.post('/v1/inventory/minibar/products', data)
  return res.data.data
}

export const updateMinibarProductApi = async (
  id: string,
  data: Partial<MinibarProduct>
): Promise<MinibarProduct> => {
  const res = await api.put(`/v1/inventory/minibar/products/${id}`, data)
  return res.data.data
}

export const deleteMinibarProductApi = async (id: string): Promise<void> => {
  await api.delete(`/v1/inventory/minibar/products/${id}`)
}

export const getRoomMinibarsApi = async (room_id: string): Promise<RoomMinibar[]> => {
  const res = await api.get('/v1/inventory/minibar/room-minibars', { params: { room_id } })
  return res.data.data
}

export const restockRoomMinibarApi = async (data: {
  room_id: string
  minibar_product_id: string
  quantity: number
}): Promise<void> => {
  await api.post('/v1/inventory/minibar/restock-room', data)
}

// ── Assets ────────────────────────────────────────────────────────────────────

export const getAssetsApi = async (filters?: {
  status?: string
  search?: string
}): Promise<{ data: Asset[]; meta: unknown }> => {
  const res = await api.get('/v1/inventory/assets', { params: filters })
  return res.data.data
}

export const createAssetApi = async (data: Partial<Asset>): Promise<Asset> => {
  const res = await api.post('/v1/inventory/assets', data)
  return res.data.data
}

export const updateAssetApi = async (id: string, data: Partial<Asset>): Promise<Asset> => {
  const res = await api.put(`/v1/inventory/assets/${id}`, data)
  return res.data.data
}

export const retireAssetApi = async (id: string): Promise<void> => {
  await api.delete(`/v1/inventory/assets/${id}`)
}

// ── Maintenances ──────────────────────────────────────────────────────────────

export const getMaintenancesApi = async (filters?: {
  status?: string
  asset_id?: string
}): Promise<{ data: AssetMaintenance[]; meta: unknown }> => {
  const res = await api.get('/v1/inventory/maintenances', { params: filters })
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
  const res = await api.post(`/v1/inventory/assets/${assetId}/maintenance`, data)
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
  const res = await api.patch(`/v1/inventory/maintenance/${id}/complete`, data)
  return res.data.data
}

// ── Repair orders ─────────────────────────────────────────────────────────────

export const getRepairOrdersApi = async (filters?: {
  status?: string
}): Promise<{ data: RepairOrder[]; meta: unknown }> => {
  const res = await api.get('/v1/inventory/repair-orders', { params: filters })
  return res.data.data
}

export const createRepairOrderApi = async (data: {
  asset_id?: string
  room_id?: string
  description: string
}): Promise<RepairOrder> => {
  const res = await api.post('/v1/inventory/repair-orders', data)
  return res.data.data
}

export const assignRepairOrderApi = async (id: string, assigned_to: string): Promise<RepairOrder> => {
  const res = await api.patch(`/v1/inventory/repair-orders/${id}/assign`, { assigned_to })
  return res.data.data
}

export const closeRepairOrderApi = async (
  id: string,
  data: { cost?: number; notes?: string }
): Promise<RepairOrder> => {
  const res = await api.patch(`/v1/inventory/repair-orders/${id}/close`, data)
  return res.data.data
}
