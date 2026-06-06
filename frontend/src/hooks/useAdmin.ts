import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminRoomApi,
  createAdminUserApi,
  createBackupApi,
  deleteAllBackupsApi,
  createExtraServiceApi,
  createHouseApi,
  createRoomTypeApi,
  createSeasonApi,
  deleteAdminRoomApi,
  deleteAdminUserApi,
  deleteExtraServiceApi,
  deleteHouseApi,
  deleteRoomTypeApi,
  deleteSeasonApi,
  getAdminExtraServicesApi,
  getAdminHousesApi,
  getAdminPermissionsApi,
  getAdminRolesApi,
  getAdminRoomsApi,
  getAdminRoomTypesApi,
  getAdminSeasonsApi,
  getAdminUsersApi,
  getBackupsApi,
  getBackupPreviewApi,
  getBackupSettingsApi,
  saveBackupSettingsApi,
  getHotelInfoApi,
  massUpdateRoomPricesApi,
  restoreBackupApi,
  updateAdminRoomApi,
  updateAdminUserApi,
  updateExtraServiceApi,
  updateHotelInfoApi,
  updateHouseApi,
  updateRolePermissionsApi,
  updateRoomTypeApi,
  updateSeasonApi,
  uploadLogoApi,
} from '../services/admin.service'
import type { AdminUserPayload, ExtraService, House, Room, RoomType, Season } from '../types'

// ── Hotel ─────────────────────────────────────────────────────────────────────

export function useHotelInfo() {
  return useQuery({ queryKey: ['admin', 'hotel'], queryFn: getHotelInfoApi })
}

export function useHotelMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'hotel'] })

  const update = useMutation({ mutationFn: updateHotelInfoApi, onSuccess: inv })
  const uploadLogo = useMutation({ mutationFn: uploadLogoApi, onSuccess: inv })

  return { update, uploadLogo }
}

// ── Room types ────────────────────────────────────────────────────────────────

export function useAdminRoomTypes() {
  return useQuery({ queryKey: ['admin', 'room-types'], queryFn: getAdminRoomTypesApi })
}

export function useRoomTypeMutations() {
  const qc = useQueryClient()
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'room-types'] })
    qc.invalidateQueries({ queryKey: ['admin', 'rooms'] })
  }

  const create = useMutation({ mutationFn: (d: Partial<RoomType>) => createRoomTypeApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoomType> }) => updateRoomTypeApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteRoomTypeApi, onSuccess: inv })
  const massPrice = useMutation({
    mutationFn: ({ room_type_id, base_price }: { room_type_id: string; base_price: number }) =>
      massUpdateRoomPricesApi(room_type_id, base_price),
    onSuccess: inv,
  })

  return { create, update, remove, massPrice }
}

// ── Houses ────────────────────────────────────────────────────────────────────

export function useAdminHouses() {
  return useQuery({ queryKey: ['admin', 'houses'], queryFn: getAdminHousesApi })
}

export function useHouseMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'houses'] })

  const create = useMutation({ mutationFn: (d: { name: string; price: number }) => createHouseApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<House> }) => updateHouseApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteHouseApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export function useAdminRooms() {
  return useQuery({ queryKey: ['admin', 'rooms'], queryFn: getAdminRoomsApi })
}

export function useAdminRoomMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] })

  const create = useMutation({
    mutationFn: (d: Parameters<typeof createAdminRoomApi>[0]) => createAdminRoomApi(d),
    onSuccess: inv,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) => updateAdminRoomApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteAdminRoomApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export function useAdminSeasons() {
  return useQuery({ queryKey: ['admin', 'seasons'], queryFn: getAdminSeasonsApi })
}

export function useSeasonMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'seasons'] })

  const create = useMutation({ mutationFn: (d: Partial<Season>) => createSeasonApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Season> }) => updateSeasonApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteSeasonApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Extra services ────────────────────────────────────────────────────────────

export function useAdminExtraServices() {
  return useQuery({ queryKey: ['admin', 'extra-services'], queryFn: getAdminExtraServicesApi })
}

export function useExtraServiceMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'extra-services'] })

  const create = useMutation({ mutationFn: (d: Partial<ExtraService>) => createExtraServiceApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExtraService> }) => updateExtraServiceApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteExtraServiceApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: getAdminUsersApi })
}

export function useAdminUserMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] })

  const create = useMutation({ mutationFn: (d: AdminUserPayload) => createAdminUserApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUserPayload> }) => updateAdminUserApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteAdminUserApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Roles & permissions ───────────────────────────────────────────────────────

export function useAdminRoles() {
  return useQuery({ queryKey: ['admin', 'roles'], queryFn: getAdminRolesApi })
}

export function useAdminPermissions() {
  return useQuery({ queryKey: ['admin', 'permissions'], queryFn: getAdminPermissionsApi })
}

export function useRolePermissionMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'roles'] })

  const update = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      updateRolePermissionsApi(roleId, permissions),
    onSuccess: inv,
  })

  return { update }
}

// ── Backups ───────────────────────────────────────────────────────────────────

export function useBackups() {
  return useQuery({ queryKey: ['admin', 'backups'], queryFn: getBackupsApi })
}

export function useBackupPreview(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'backup-preview'],
    queryFn:  getBackupPreviewApi,
    enabled,
    staleTime: 0,
  })
}

export function useBackupMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'backups'] })

  const create = useMutation({ mutationFn: createBackupApi, onSuccess: inv })
  const restore = useMutation({ mutationFn: restoreBackupApi, onSuccess: inv })
  const deleteAll = useMutation({ mutationFn: deleteAllBackupsApi, onSuccess: inv })

  return { create, restore, deleteAll }
}

export function useBackupSettings() {
  return useQuery({ queryKey: ['admin', 'backup-settings'], queryFn: getBackupSettingsApi })
}

export function useSaveBackupSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveBackupSettingsApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'backup-settings'] }),
  })
}
