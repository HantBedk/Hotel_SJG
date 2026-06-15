import api from '@/lib/axios'
import type { Nationality } from '@/types/person'
import type {
  AdminUser,
  AdminUserPayload,
  AdminPersona,
  AdminPersonaPayload,
  ApiResponse,
  BackupFile,
  ExtraService,
  HotelInfo,
  HotelInfoPayload,
  HotelLogoUploadResult,
  HotelSummary,
  House,
  Room,
  RoomType,
  Season,
} from '@/types'

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  globalThis.URL.revokeObjectURL(url)
}

// ── Hotels (multi-tenant admin) ───────────────────────────────────────────────

export async function getAdminHotelsApi(): Promise<HotelSummary[]> {
  const { data } = await api.get<ApiResponse<HotelSummary[]>>('/admin/hotels')
  return data.data
}

export async function createHotelApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiResponse<Record<string, unknown>>>('/admin/hotels', payload)
  return data.data
}

export async function updateHotelApi(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.put<ApiResponse<Record<string, unknown>>>(`/admin/hotels/${id}`, payload)
  return data.data
}

export async function deleteHotelApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/hotels/${id}`)
  return data
}

// ── Hotel (activo) ────────────────────────────────────────────────────────────

export async function getHotelInfoApi(): Promise<HotelInfo> {
  const { data } = await api.get<ApiResponse<HotelInfo>>('/admin/hotel')
  return data.data
}

export async function updateHotelInfoApi(payload: HotelInfoPayload): Promise<HotelInfo> {
  const { data } = await api.put<ApiResponse<HotelInfo>>('/admin/hotel', payload)
  return data.data
}

export async function uploadLogoApi(file: File): Promise<HotelLogoUploadResult> {
  const form = new FormData()
  form.append('logo', file)
  const { data } = await api.post<ApiResponse<HotelLogoUploadResult>>('/admin/hotel/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

// ── Room types ────────────────────────────────────────────────────────────────

export async function getAdminRoomTypesApi(): Promise<RoomType[]> {
  const { data } = await api.get<ApiResponse<RoomType[]>>('/admin/room-types')
  return data.data
}

export async function createRoomTypeApi(payload: Partial<RoomType>): Promise<RoomType> {
  const { data } = await api.post<ApiResponse<RoomType>>('/admin/room-types', payload)
  return data.data
}

export async function updateRoomTypeApi(id: string, payload: Partial<RoomType>): Promise<RoomType> {
  const { data } = await api.put<ApiResponse<RoomType>>(`/admin/room-types/${id}`, payload)
  return data.data
}

export async function deleteRoomTypeApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/room-types/${id}`)
  return data
}

// ── Houses ────────────────────────────────────────────────────────────────────

export async function getAdminHousesApi(): Promise<House[]> {
  const { data } = await api.get<ApiResponse<House[]>>('/admin/houses')
  return data.data
}

export async function createHouseApi(payload: { name: string; price: number }): Promise<House> {
  const { data } = await api.post<ApiResponse<House>>('/admin/houses', payload)
  return data.data
}

export async function updateHouseApi(id: string, payload: Partial<House>): Promise<House> {
  const { data } = await api.put<ApiResponse<House>>(`/admin/houses/${id}`, payload)
  return data.data
}

export async function deleteHouseApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/houses/${id}`)
  return data
}

// ── Rooms (admin) ─────────────────────────────────────────────────────────────

export interface CreateAdminRoomPayload {
  room_type_id: string
  house_id?: string | null
  number: string
  floor?: number | null
  notes?: string | null
}

export async function getAdminRoomsApi(): Promise<Room[]> {
  const { data } = await api.get<ApiResponse<Room[]>>('/admin/rooms')
  return data.data
}

export async function createAdminRoomApi(payload: CreateAdminRoomPayload): Promise<Room> {
  const { data } = await api.post<ApiResponse<Room>>('/admin/rooms', payload)
  return data.data
}

export async function updateAdminRoomApi(id: string, payload: Partial<Room>): Promise<Room> {
  const { data } = await api.put<ApiResponse<Room>>(`/admin/rooms/${id}`, payload)
  return data.data
}

export async function deleteAdminRoomApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/rooms/${id}`)
  return data
}

export async function massUpdateRoomPricesApi(roomTypeId: string, basePrice: number): Promise<RoomType> {
  const { data } = await api.patch<ApiResponse<RoomType>>('/admin/rooms/mass-update', {
    room_type_id: roomTypeId,
    base_price: basePrice,
  })
  return data.data
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export async function getAdminSeasonsApi(): Promise<Season[]> {
  const { data } = await api.get<ApiResponse<Season[]>>('/admin/seasons')
  return data.data
}

export async function createSeasonApi(payload: Partial<Season>): Promise<Season> {
  const { data } = await api.post<ApiResponse<Season>>('/admin/seasons', payload)
  return data.data
}

export async function updateSeasonApi(id: string, payload: Partial<Season>): Promise<Season> {
  const { data } = await api.put<ApiResponse<Season>>(`/admin/seasons/${id}`, payload)
  return data.data
}

export async function deleteSeasonApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/seasons/${id}`)
  return data
}

// ── Extra services ────────────────────────────────────────────────────────────

export async function getAdminExtraServicesApi(): Promise<ExtraService[]> {
  const { data } = await api.get<ApiResponse<ExtraService[]>>('/admin/extra-services')
  return data.data
}

export async function createExtraServiceApi(payload: Partial<ExtraService>): Promise<ExtraService> {
  const { data } = await api.post<ApiResponse<ExtraService>>('/admin/extra-services', payload)
  return data.data
}

export async function updateExtraServiceApi(id: string, payload: Partial<ExtraService>): Promise<ExtraService> {
  const { data } = await api.put<ApiResponse<ExtraService>>(`/admin/extra-services/${id}`, payload)
  return data.data
}

export async function deleteExtraServiceApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/extra-services/${id}`)
  return data
}

// ── Nationalities ─────────────────────────────────────────────────────────────

export type NationalityPayload = Pick<Nationality, 'name' | 'iso_code' | 'sort_order' | 'is_active'>

export async function getAdminNationalitiesApi(): Promise<Nationality[]> {
  const { data } = await api.get<ApiResponse<Nationality[]>>('/admin/nationalities')
  return data.data
}

export async function createNationalityApi(payload: NationalityPayload): Promise<Nationality> {
  const { data } = await api.post<ApiResponse<Nationality>>('/admin/nationalities', payload)
  return data.data
}

export async function updateNationalityApi(id: string, payload: Partial<NationalityPayload>): Promise<Nationality> {
  const { data } = await api.put<ApiResponse<Nationality>>(`/admin/nationalities/${id}`, payload)
  return data.data
}

export async function deleteNationalityApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/nationalities/${id}`)
  return data
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getAdminUsersApi(): Promise<AdminUser[]> {
  const { data } = await api.get<ApiResponse<AdminUser[]>>('/admin/users')
  return data.data
}

export interface AdminPersonasFilters {
  search?: string
  role?: string
  page?: number
  per_page?: number
}

export interface AdminPersonasListResult {
  data: AdminPersona[]
  current_page: number
  last_page: number
  total: number
}

export async function getAdminPersonasApi(
  filters?: AdminPersonasFilters,
): Promise<AdminPersonasListResult> {
  const { data } = await api.get<ApiResponse<AdminPersonasListResult>>('/admin/personas', {
    params: filters,
  })
  return data.data
}

export async function createAdminPersonaApi(payload: AdminPersonaPayload): Promise<AdminPersona> {
  const { data } = await api.post<ApiResponse<AdminPersona>>('/admin/personas', payload)
  return data.data
}

export async function updateAdminPersonaApi(id: string, payload: Partial<AdminPersonaPayload>): Promise<AdminPersona> {
  const { data } = await api.put<ApiResponse<AdminPersona>>(`/admin/personas/${id}`, payload)
  return data.data
}

export async function deleteAdminPersonaApi(id: string): Promise<void> {
  await api.delete(`/admin/personas/${id}`)
}

export async function createAdminUserApi(payload: AdminUserPayload): Promise<AdminUser> {
  const { data } = await api.post<ApiResponse<AdminUser>>('/admin/users', payload)
  return data.data
}

export async function updateAdminUserApi(id: string, payload: Partial<AdminUserPayload>): Promise<AdminUser> {
  const { data } = await api.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, payload)
  return data.data
}

export async function deleteAdminUserApi(id: string): Promise<ApiResponse> {
  const { data } = await api.delete<ApiResponse>(`/admin/users/${id}`)
  return data
}

// ── Roles & permissions ─────────────────────────────────────────────────────

export interface AdminRole {
  id: string
  name: string
  permissions: string[]
}

export async function getAdminRolesApi(): Promise<AdminRole[]> {
  const { data } = await api.get<ApiResponse<AdminRole[]>>('/admin/roles')
  return data.data
}

export async function getAdminPermissionsApi(): Promise<string[]> {
  const { data } = await api.get<ApiResponse<string[]>>('/admin/permissions')
  return data.data
}

export async function updateRolePermissionsApi(roleId: string, permissions: string[]): Promise<AdminRole> {
  const { data } = await api.put<ApiResponse<AdminRole>>(`/admin/roles/${roleId}/permissions`, { permissions })
  return data.data
}

// ── Backups ───────────────────────────────────────────────────────────────────

export async function getBackupsApi(): Promise<BackupFile[]> {
  const { data } = await api.get<ApiResponse<BackupFile[]>>('/admin/backups')
  return data.data
}

export interface BackupPreview {
  users: number
  guests: number
  companies: number
  rooms: number
  reservations: number
  stays: number
  active_stays: number
  inventory_items: number
  minibar_products: number
}

export async function getBackupPreviewApi(): Promise<BackupPreview> {
  const { data } = await api.get<ApiResponse<BackupPreview>>('/admin/backups/preview')
  return data.data
}

export async function createBackupApi(): Promise<BackupFile> {
  const { data } = await api.post<ApiResponse<BackupFile>>('/admin/backups')
  return data.data
}

export interface DeleteAllBackupsResult {
  deleted: number
}

export async function deleteAllBackupsApi(): Promise<DeleteAllBackupsResult> {
  const { data } = await api.delete<ApiResponse<DeleteAllBackupsResult>>('/admin/backups')
  return data.data
}

export interface WipeDatabaseResult {
  success: boolean
  keep_users: boolean
  message: string
}

export async function wipeDatabaseApi(opts: { keepUsers: boolean }): Promise<WipeDatabaseResult> {
  const { data } = await api.post<WipeDatabaseResult>('/admin/database/wipe', {
    confirm: 'BORRAR',
    keep_users: opts.keepUsers,
  })
  return data
}

export async function downloadBackupApi(filename: string): Promise<void> {
  const { data } = await api.get<Blob>(
    `/admin/backups/${encodeURIComponent(filename)}/download`,
    { responseType: 'blob' },
  )
  triggerBlobDownload(data, filename)
}

export async function restoreBackupApi(file: File): Promise<ApiResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<ApiResponse>('/admin/backups/restore', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function downloadMigrationKitApi(): Promise<void> {
  const { data } = await api.get<Blob>('/admin/backups/migration-kit', { responseType: 'blob' })
  triggerBlobDownload(data, 'kit-migracion-backups.zip')
}

export interface BackupSettings {
  auto_backup: boolean
  auto_backup_time: string
  auto_backup_folder: string
  retention_days: number
  shared_container_path?: string
  shared_host_path?: string
}

export async function getBackupSettingsApi(): Promise<BackupSettings> {
  const { data } = await api.get<ApiResponse<BackupSettings>>('/admin/backups/settings')
  return data.data
}

export async function saveBackupSettingsApi(payload: BackupSettings): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>('/admin/backups/settings', payload)
  return data
}

export interface BackupFolderCheck {
  using_default: boolean
  resolved_path: string
  exists: boolean
  writable: boolean
  message: string
}

export async function validateBackupFolderApi(path: string): Promise<BackupFolderCheck> {
  const { data } = await api.post<ApiResponse<BackupFolderCheck>>('/admin/backups/validate-folder', { path })
  return data.data
}
