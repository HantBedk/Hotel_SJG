import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getCategoriesApi,
  createCategoryApi,
  getItemsApi,
  createItemApi,
  updateItemApi,
  deleteItemApi,
  restockItemApi,
  adjustStockApi,
  deliverItemApi,
  getMinibarProductsApi,
  createMinibarProductApi,
  updateMinibarProductApi,
  deleteMinibarProductApi,
  getRoomMinibarsApi,
  restockRoomMinibarApi,
  getAssetsApi,
  createAssetApi,
  updateAssetApi,
  retireAssetApi,
  getMaintenancesApi,
  addMaintenanceApi,
  completeMaintenanceApi,
  getRepairOrdersApi,
  createRepairOrderApi,
  assignRepairOrderApi,
  closeRepairOrderApi,
  type ItemFilters,
} from '@/services/inventory.service'
import type { Asset, InventoryItem, MinibarProduct } from '@/types'

type ApiError = { response?: { data?: { message?: string } } }
const errMsg = (e: ApiError, fallback: string) => e?.response?.data?.message ?? fallback

// ── Categories ────────────────────────────────────────────────────────────────

export function useInventoryCategories() {
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: getCategoriesApi,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategoryApi,
    onSuccess: () => {
      toast.success('Categoría creada.')
      qc.invalidateQueries({ queryKey: ['inventory-categories'] })
    },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al crear categoría.')),
  })
}

// ── Items ─────────────────────────────────────────────────────────────────────

export function useInventoryItems(filters?: ItemFilters) {
  return useQuery({
    queryKey: ['inventory-items', filters],
    queryFn: () => getItemsApi(filters),
  })
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => getItemsApi().then(r => r),
    enabled: false,
  })
}

export function useInventoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['inventory-items'] })

  const createMutation = useMutation({
    mutationFn: createItemApi,
    onSuccess: () => { toast.success('Producto creado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al crear producto.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) => updateItemApi(id, data),
    onSuccess: () => { toast.success('Producto actualizado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al actualizar producto.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteItemApi,
    onSuccess: () => { toast.success('Producto eliminado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al eliminar producto.')),
  })

  const restockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; unit_price?: number; notes?: string } }) =>
      restockItemApi(id, data),
    onSuccess: () => { toast.success('Stock recargado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al recargar stock.')),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { new_stock: number; notes?: string } }) =>
      adjustStockApi(id, data),
    onSuccess: () => { toast.success('Stock ajustado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al ajustar stock.')),
  })

  const deliverMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { quantity: number; destination_user_id: string; notes?: string }
    }) => deliverItemApi(id, data),
    onSuccess: () => { toast.success('Entrega registrada.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al registrar entrega.')),
  })

  return { createMutation, updateMutation, deleteMutation, restockMutation, adjustMutation, deliverMutation }
}

// ── Minibar products ──────────────────────────────────────────────────────────

export function useMinibarProducts() {
  return useQuery({
    queryKey: ['minibar-products'],
    queryFn: getMinibarProductsApi,
  })
}

export function useRoomMinibars(roomId: string | null) {
  return useQuery({
    queryKey: ['room-minibars', roomId],
    queryFn: () => getRoomMinibarsApi(roomId as string),
    enabled: !!roomId,
  })
}

export function useMinibarProductMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['minibar-products'] })

  const createMutation = useMutation({
    mutationFn: createMinibarProductApi,
    onSuccess: () => { toast.success('Producto de minibar creado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al crear producto.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MinibarProduct> }) =>
      updateMinibarProductApi(id, data),
    onSuccess: () => { toast.success('Producto actualizado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al actualizar.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMinibarProductApi,
    onSuccess: () => { toast.success('Producto desactivado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al desactivar.')),
  })

  const restockRoomMutation = useMutation({
    mutationFn: restockRoomMinibarApi,
    onSuccess: (_data, vars) => {
      toast.success('Minibar repuesto.')
      qc.invalidateQueries({ queryKey: ['room-minibars', vars.room_id] })
    },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al reponer minibar.')),
  })

  return { createMutation, updateMutation, deleteMutation, restockRoomMutation }
}

// ── Assets ────────────────────────────────────────────────────────────────────

export function useAssets(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => getAssetsApi(filters),
  })
}

export function useAssetMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['assets'] })

  const createMutation = useMutation({
    mutationFn: createAssetApi,
    onSuccess: () => { toast.success('Activo creado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al crear activo.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) => updateAssetApi(id, data),
    onSuccess: () => { toast.success('Activo actualizado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al actualizar activo.')),
  })

  const retireMutation = useMutation({
    mutationFn: retireAssetApi,
    onSuccess: () => { toast.success('Activo retirado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al retirar activo.')),
  })

  return { createMutation, updateMutation, retireMutation }
}

// ── Maintenances ──────────────────────────────────────────────────────────────

export function useMaintenances(filters?: { status?: string; asset_id?: string }) {
  return useQuery({
    queryKey: ['maintenances', filters],
    queryFn: () => getMaintenancesApi(filters),
  })
}

export function useMaintenanceMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['maintenances'] })
    qc.invalidateQueries({ queryKey: ['assets'] })
  }

  const addMutation = useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string
      data: { scheduled_date: string; description: string; technician_id?: string }
    }) => addMaintenanceApi(assetId, data),
    onSuccess: () => { toast.success('Mantenimiento programado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al programar mantenimiento.')),
  })

  const completeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { completed_date?: string; cost?: number; notes?: string }
    }) => completeMaintenanceApi(id, data),
    onSuccess: () => { toast.success('Mantenimiento completado.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al completar mantenimiento.')),
  })

  return { addMutation, completeMutation }
}

// ── Repair orders ─────────────────────────────────────────────────────────────

export function useRepairOrders(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['repair-orders', filters],
    queryFn: () => getRepairOrdersApi(filters),
  })
}

export function useRepairOrderMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['repair-orders'] })

  const createMutation = useMutation({
    mutationFn: createRepairOrderApi,
    onSuccess: () => { toast.success('Orden de reparación creada.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al crear orden.')),
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, assigned_to }: { id: string; assigned_to: string }) =>
      assignRepairOrderApi(id, assigned_to),
    onSuccess: () => { toast.success('Orden asignada.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al asignar orden.')),
  })

  const closeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { cost?: number; notes?: string } }) =>
      closeRepairOrderApi(id, data),
    onSuccess: () => { toast.success('Orden cerrada.'); invalidate() },
    onError: (e: ApiError) => toast.error(errMsg(e, 'Error al cerrar orden.')),
  })

  return { createMutation, assignMutation, closeMutation }
}
