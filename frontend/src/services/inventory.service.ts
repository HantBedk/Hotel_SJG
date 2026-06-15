import api from '@/lib/axios'
import type {
  ApiResponse,
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

export interface PaginatedListResult<T> {
  data: T[]
  meta: unknown
}

export type ItemsListResult = PaginatedListResult<InventoryItem>
export type ItemTransactionsResult = PaginatedListResult<InventoryTransaction>
export type AssetsListResult = PaginatedListResult<Asset>
export type MaintenancesListResult = PaginatedListResult<AssetMaintenance>
export type RepairOrdersListResult = PaginatedListResult<RepairOrder>

// ── Categories ────────────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name: string
  type: string
}

export async function getCategoriesApi(): Promise<InventoryCategory[]> {
  const { data } = await api.get<ApiResponse<InventoryCategory[]>>('/inventory/categories')
  return data.data
}

export async function createCategoryApi(payload: CreateCategoryPayload): Promise<InventoryCategory> {
  const { data } = await api.post<ApiResponse<InventoryCategory>>('/inventory/categories', payload)
  return data.data
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

export interface RestockItemPayload {
  quantity: number
  unit_price?: number
  notes?: string
}

export interface AdjustStockPayload {
  new_stock: number
  notes?: string
}

export interface DeliverItemPayload {
  quantity: number
  destination_user_id: string
  notes?: string
}

export async function getItemsApi(filters?: ItemFilters): Promise<ItemsListResult> {
  const { data } = await api.get<ApiResponse<ItemsListResult>>('/inventory/items', { params: filters })
  return data.data
}

export async function getItemApi(id: string): Promise<InventoryItem> {
  const { data } = await api.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`)
  return data.data
}

export async function createItemApi(payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>('/inventory/items', payload)
  return data.data
}

export async function updateItemApi(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data } = await api.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, payload)
  return data.data
}

export async function deleteItemApi(id: string): Promise<void> {
  await api.delete(`/inventory/items/${id}`)
}

export async function restockItemApi(id: string, payload: RestockItemPayload): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/items/${id}/restock`, payload)
  return data.data
}

export async function adjustStockApi(id: string, payload: AdjustStockPayload): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/items/${id}/adjust`, payload)
  return data.data
}

export async function deliverItemApi(id: string, payload: DeliverItemPayload): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/items/${id}/deliver`, payload)
  return data.data
}

export async function getItemTransactionsApi(id: string): Promise<ItemTransactionsResult> {
  const { data } = await api.get<ApiResponse<ItemTransactionsResult>>(`/inventory/items/${id}/transactions`)
  return data.data
}

// ── Minibar products ──────────────────────────────────────────────────────────

export async function getMinibarProductsApi(): Promise<MinibarProduct[]> {
  const { data } = await api.get<ApiResponse<MinibarProduct[]>>('/inventory/minibar/products')
  return data.data
}

export async function createMinibarProductApi(payload: Partial<MinibarProduct>): Promise<MinibarProduct> {
  const { data } = await api.post<ApiResponse<MinibarProduct>>('/inventory/minibar/products', payload)
  return data.data
}

export async function updateMinibarProductApi(
  id: string,
  payload: Partial<MinibarProduct>,
): Promise<MinibarProduct> {
  const { data } = await api.put<ApiResponse<MinibarProduct>>(`/inventory/minibar/products/${id}`, payload)
  return data.data
}

export async function deleteMinibarProductApi(id: string): Promise<void> {
  await api.delete(`/inventory/minibar/products/${id}`)
}

export async function getRoomMinibarsApi(roomId: string): Promise<RoomMinibar[]> {
  const { data } = await api.get<ApiResponse<RoomMinibar[]>>('/inventory/minibar/room-minibars', {
    params: { room_id: roomId },
  })
  return data.data
}

export interface RoomMinibarQuantityPayload {
  room_id: string
  minibar_product_id: string
  quantity: number
}

export async function restockRoomMinibarApi(payload: RoomMinibarQuantityPayload): Promise<void> {
  await api.post('/inventory/minibar/restock-room', payload)
}

export async function returnFromRoomMinibarApi(payload: RoomMinibarQuantityPayload): Promise<void> {
  await api.post('/inventory/minibar/return-from-room', payload)
}

// ── Minibars (1 por habitación) ──────────────────────────────────────────────

export interface CreateMinibarPayload {
  room_id: string
  name?: string | null
  notes?: string | null
}

export async function getMinibarsApi(): Promise<Minibar[]> {
  const { data } = await api.get<ApiResponse<Minibar[]>>('/inventory/minibar/minibars')
  return data.data
}

export async function createMinibarApi(payload: CreateMinibarPayload): Promise<Minibar> {
  const { data } = await api.post<ApiResponse<Minibar>>('/inventory/minibar/minibars', payload)
  return data.data
}

export async function updateMinibarApi(
  id: string,
  payload: Partial<Pick<Minibar, 'name' | 'notes' | 'active'>>,
): Promise<Minibar> {
  const { data } = await api.put<ApiResponse<Minibar>>(`/inventory/minibar/minibars/${id}`, payload)
  return data.data
}

export async function deleteMinibarApi(id: string): Promise<void> {
  await api.delete(`/inventory/minibar/minibars/${id}`)
}

// ── Assets ────────────────────────────────────────────────────────────────────

export interface AssetFilters {
  status?: string
  search?: string
  page?: number
  per_page?: number
}

export async function getAssetsApi(filters?: AssetFilters): Promise<AssetsListResult> {
  const { data } = await api.get<ApiResponse<AssetsListResult>>('/inventory/assets', { params: filters })
  return data.data
}

export async function createAssetApi(payload: Partial<Asset>): Promise<Asset> {
  const { data } = await api.post<ApiResponse<Asset>>('/inventory/assets', payload)
  return data.data
}

export async function updateAssetApi(id: string, payload: Partial<Asset>): Promise<Asset> {
  const { data } = await api.put<ApiResponse<Asset>>(`/inventory/assets/${id}`, payload)
  return data.data
}

export async function retireAssetApi(id: string): Promise<void> {
  await api.delete(`/inventory/assets/${id}`)
}

// ── Maintenances ──────────────────────────────────────────────────────────────

export interface MaintenanceFilters {
  status?: string
  asset_id?: string
  page?: number
  per_page?: number
}

export interface AddMaintenancePayload {
  scheduled_date: string
  description: string
  technician_id?: string
  next_maintenance_date?: string
}

export interface CompleteMaintenancePayload {
  completed_date?: string
  cost?: number
  notes?: string
  next_maintenance_date?: string
}

export async function getMaintenancesApi(filters?: MaintenanceFilters): Promise<MaintenancesListResult> {
  const { data } = await api.get<ApiResponse<MaintenancesListResult>>('/inventory/maintenances', { params: filters })
  return data.data
}

export async function addMaintenanceApi(
  assetId: string,
  payload: AddMaintenancePayload,
): Promise<AssetMaintenance> {
  const { data } = await api.post<ApiResponse<AssetMaintenance>>(
    `/inventory/assets/${assetId}/maintenance`,
    payload,
  )
  return data.data
}

export async function completeMaintenanceApi(
  id: string,
  payload: CompleteMaintenancePayload,
): Promise<AssetMaintenance> {
  const { data } = await api.patch<ApiResponse<AssetMaintenance>>(
    `/inventory/maintenance/${id}/complete`,
    payload,
  )
  return data.data
}

// ── Repair orders ─────────────────────────────────────────────────────────────

export interface RepairOrderFilters {
  status?: string
  room_id?: string
  page?: number
  per_page?: number
}

export interface CreateRepairOrderPayload {
  asset_id?: string
  room_id?: string
  description: string
}

export interface CloseRepairOrderPayload {
  cost?: number
  notes?: string
}

export async function getRepairOrdersApi(filters?: RepairOrderFilters): Promise<RepairOrdersListResult> {
  const { data } = await api.get<ApiResponse<RepairOrdersListResult>>('/inventory/repair-orders', { params: filters })
  return data.data
}

export async function createRepairOrderApi(payload: CreateRepairOrderPayload): Promise<RepairOrder> {
  const { data } = await api.post<ApiResponse<RepairOrder>>('/inventory/repair-orders', payload)
  return data.data
}

export async function assignRepairOrderApi(id: string, assignedTo: string): Promise<RepairOrder> {
  const { data } = await api.patch<ApiResponse<RepairOrder>>(`/inventory/repair-orders/${id}/assign`, {
    assigned_to: assignedTo,
  })
  return data.data
}

export async function closeRepairOrderApi(id: string, payload: CloseRepairOrderPayload): Promise<RepairOrder> {
  const { data } = await api.patch<ApiResponse<RepairOrder>>(`/inventory/repair-orders/${id}/close`, payload)
  return data.data
}

// ── Inventory history (admin only) ────────────────────────────────────────────

export interface HistoryFilters {
  source?: 'all' | 'inventory' | 'minibar'
  search?: string
  date_from?: string
  date_to?: string
  page?: number
}

export async function getInventoryHistoryApi(filters?: HistoryFilters): Promise<InventoryHistoryPage> {
  const { data } = await api.get<ApiResponse<InventoryHistoryPage>>('/inventory/history', { params: filters })
  return data.data
}

export interface LowStockThreshold {
  threshold: number | null
}

export async function getLowStockThresholdApi(): Promise<LowStockThreshold> {
  const { data } = await api.get<ApiResponse<LowStockThreshold>>('/inventory/low-stock-threshold')
  return data.data
}

export async function setLowStockThresholdApi(threshold: number): Promise<{ threshold: number }> {
  const { data } = await api.post<ApiResponse<{ threshold: number }>>('/inventory/low-stock-threshold', { threshold })
  return data.data
}
