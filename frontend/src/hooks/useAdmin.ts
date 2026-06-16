import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hotelQueryKey, useHotelQueryKey } from '@/lib/hotelQueryKey'
import {
  createAdminRoomApi,
  createAdminUserApi,
  createBackupApi,
  deleteAllBackupsApi,
  createExtraServiceApi,
  createNationalityApi,
  createRoomFeatureApi,
  createHouseApi,
  createRoomTypeApi,
  createSeasonApi,
  deleteAdminRoomApi,
  deleteAdminUserApi,
  deleteExtraServiceApi,
  deleteNationalityApi,
  deleteRoomFeatureApi,
  deleteHouseApi,
  deleteRoomTypeApi,
  deleteSeasonApi,
  getAdminExtraServicesApi,
  getAdminNationalitiesApi,
  getAdminRoomFeaturesApi,
  getAdminHousesApi,
  getAdminPermissionsApi,
  getAdminRolesApi,
  getAdminRoomsApi,
  getAdminRoomTypesApi,
  getAdminSeasonsApi,
  getAdminUsersApi,
  getAdminPersonasApi,
  createAdminPersonaApi,
  updateAdminPersonaApi,
  deleteAdminPersonaApi,
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
  updateNationalityApi,
  updateRoomFeatureApi,
  updateHotelInfoApi,
  updateHouseApi,
  updateRolePermissionsApi,
  updateRoomTypeApi,
  updateSeasonApi,
  uploadLogoApi,
  wipeDatabaseApi,
} from '../services/admin.service'
import type { Nationality } from '@/types/person'
import type { AdminUserPayload, AdminPersonaPayload, ExtraService, House, Room, RoomFeature, RoomType, Season } from '../types'

// ── Hotel ─────────────────────────────────────────────────────────────────────

export function useHotelInfo() {
  const queryKey = useHotelQueryKey('admin', 'hotel')
  return useQuery({ queryKey, queryFn: getHotelInfoApi })
}

export function useHotelMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'hotel') })

  const update = useMutation({ mutationFn: updateHotelInfoApi, onSuccess: inv })
  const uploadLogo = useMutation({ mutationFn: uploadLogoApi, onSuccess: inv })

  return { update, uploadLogo }
}

// ── Room types ────────────────────────────────────────────────────────────────

export function useAdminRoomTypes() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'room-types'), queryFn: getAdminRoomTypesApi })
}

export function useRoomTypeMutations() {
  const qc = useQueryClient()
  const inv = () => {
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'room-types') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'rooms') })
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
  return useQuery({ queryKey: hotelQueryKey('admin', 'houses'), queryFn: getAdminHousesApi })
}

export function useHouseMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'houses') })

  const create = useMutation({ mutationFn: (d: { name: string; price: number; active?: boolean }) => createHouseApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; price?: number; active?: boolean } }) => updateHouseApi(id, data as Partial<House>),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteHouseApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export function useAdminRooms() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'rooms'), queryFn: getAdminRoomsApi })
}

export function useAdminRoomMutations() {
  const qc = useQueryClient()
  const inv = () => {
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'rooms') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('rooms') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('dashboard') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('activity-logs') })
  }

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
  return useQuery({ queryKey: hotelQueryKey('admin', 'seasons'), queryFn: getAdminSeasonsApi })
}

export function useSeasonMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'seasons') })

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
  return useQuery({ queryKey: hotelQueryKey('admin', 'extra-services'), queryFn: getAdminExtraServicesApi })
}

export function useExtraServiceMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'extra-services') })

  const create = useMutation({ mutationFn: (d: { name?: string; price?: number; description?: string | null; active?: boolean }) => createExtraServiceApi(d as Partial<ExtraService>), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; price?: number; description?: string | null; active?: boolean } }) => updateExtraServiceApi(id, data as Partial<ExtraService>),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteExtraServiceApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Nationalities ─────────────────────────────────────────────────────────────

export function useAdminNationalities() {
  return useQuery({ queryKey: ['admin', 'nationalities'], queryFn: getAdminNationalitiesApi })
}

export function useNationalityMutations() {
  const qc = useQueryClient()
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'nationalities'] })
    qc.invalidateQueries({ queryKey: ['nationalities'] })
  }

  const create = useMutation({
    mutationFn: (payload: Pick<Nationality, 'name' | 'iso_code' | 'sort_order' | 'is_active'>) => createNationalityApi(payload),
    onSuccess: inv,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Nationality, 'name' | 'iso_code' | 'sort_order' | 'is_active'>> }) =>
      updateNationalityApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteNationalityApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Room features ─────────────────────────────────────────────────────────────

export function useAdminRoomFeatures() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'room-features'), queryFn: getAdminRoomFeaturesApi })
}

export function useRoomFeatureMutations() {
  const qc = useQueryClient()
  const inv = () => {
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'room-features') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'rooms') })
  }

  const create = useMutation({
    mutationFn: (payload: Pick<RoomFeature, 'name' | 'sort_order' | 'is_active'>) => createRoomFeatureApi(payload),
    onSuccess: inv,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<RoomFeature, 'name' | 'sort_order' | 'is_active'>> }) =>
      updateRoomFeatureApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteRoomFeatureApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'users'), queryFn: getAdminUsersApi })
}

export function useAdminUserMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'users') })

  const create = useMutation({ mutationFn: (d: AdminUserPayload) => createAdminUserApi(d), onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUserPayload> }) => updateAdminUserApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteAdminUserApi, onSuccess: inv })

  return { create, update, remove }
}

export function useAdminPersonas(filters?: { search?: string; role?: string; page?: number }) {
  return useQuery({
    queryKey: hotelQueryKey('admin', 'personas', filters),
    queryFn:  () => getAdminPersonasApi(filters),
  })
}

export function useAdminPersonaMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'personas') })

  const create = useMutation({ mutationFn: createAdminPersonaApi, onSuccess: inv })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminPersonaPayload> }) =>
      updateAdminPersonaApi(id, data),
    onSuccess: inv,
  })
  const remove = useMutation({ mutationFn: deleteAdminPersonaApi, onSuccess: inv })

  return { create, update, remove }
}

// ── Roles & permissions ───────────────────────────────────────────────────────

export function useAdminRoles() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'roles'), queryFn: getAdminRolesApi })
}

export function useAdminPermissions() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'permissions'), queryFn: getAdminPermissionsApi })
}

export function useRolePermissionMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'roles') })

  const update = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      updateRolePermissionsApi(roleId, permissions),
    onSuccess: inv,
  })

  return { update }
}

// ── Backups ───────────────────────────────────────────────────────────────────

export function useBackups() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'backups'), queryFn: getBackupsApi })
}

export function useBackupPreview(enabled = true) {
  return useQuery({
    queryKey: hotelQueryKey('admin', 'backup-preview'),
    queryFn:  getBackupPreviewApi,
    enabled,
    staleTime: 0,
  })
}

export function useBackupMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'backups') })

  const create = useMutation({ mutationFn: createBackupApi, onSuccess: inv })
  const restore = useMutation({ mutationFn: restoreBackupApi, onSuccess: inv })
  const deleteAll = useMutation({ mutationFn: deleteAllBackupsApi, onSuccess: inv })

  return { create, restore, deleteAll }
}

export function useBackupSettings() {
  return useQuery({ queryKey: hotelQueryKey('admin', 'backup-settings'), queryFn: getBackupSettingsApi })
}

export function useWipeDatabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: wipeDatabaseApi,
    onSuccess: () => qc.clear(),
  })
}

export function useSaveBackupSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveBackupSettingsApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'backup-settings') }),
  })
}
