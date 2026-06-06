import api from '@/lib/axios'
import type {
  AdminUser,
  AdminUserPayload,
  BackupFile,
  ExtraService,
  House,
  Room,
  RoomType,
  Season,
} from '../types'

// ── Hotel ─────────────────────────────────────────────────────────────────────

export const getHotelInfoApi = () =>
  api.get('/admin/hotel').then(r => r.data.data)

export const updateHotelInfoApi = (data: Record<string, string>) =>
  api.put('/admin/hotel', data).then(r => r.data.data)

export const uploadLogoApi = (file: File) => {
  const form = new FormData()
  form.append('logo', file)
  return api.post('/admin/hotel/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data)
}

// ── Room types ────────────────────────────────────────────────────────────────

export const getAdminRoomTypesApi = () =>
  api.get('/admin/room-types').then(r => r.data.data as RoomType[])

export const createRoomTypeApi = (data: Partial<RoomType>) =>
  api.post('/admin/room-types', data).then(r => r.data.data as RoomType)

export const updateRoomTypeApi = (id: string, data: Partial<RoomType>) =>
  api.put(`/admin/room-types/${id}`, data).then(r => r.data.data as RoomType)

export const deleteRoomTypeApi = (id: string) =>
  api.delete(`/admin/room-types/${id}`).then(r => r.data)

// ── Houses ────────────────────────────────────────────────────────────────────

export const getAdminHousesApi = () =>
  api.get('/admin/houses').then(r => r.data.data as House[])

export const createHouseApi = (data: { name: string; price: number }) =>
  api.post('/admin/houses', data).then(r => r.data.data as House)

export const updateHouseApi = (id: string, data: Partial<House>) =>
  api.put(`/admin/houses/${id}`, data).then(r => r.data.data as House)

export const deleteHouseApi = (id: string) =>
  api.delete(`/admin/houses/${id}`).then(r => r.data)

// ── Rooms (admin) ─────────────────────────────────────────────────────────────

export const getAdminRoomsApi = () =>
  api.get('/admin/rooms').then(r => r.data.data as Room[])

export const createAdminRoomApi = (data: {
  room_type_id: string
  house_id?: string | null
  number: string
  floor?: number | null
  notes?: string | null
}) => api.post('/admin/rooms', data).then(r => r.data.data as Room)

export const updateAdminRoomApi = (id: string, data: Partial<Room>) =>
  api.put(`/admin/rooms/${id}`, data).then(r => r.data.data as Room)

export const deleteAdminRoomApi = (id: string) =>
  api.delete(`/admin/rooms/${id}`).then(r => r.data)

export const massUpdateRoomPricesApi = (room_type_id: string, base_price: number) =>
  api.patch('/admin/rooms/mass-update', { room_type_id, base_price }).then(r => r.data.data as RoomType)

// ── Seasons ───────────────────────────────────────────────────────────────────

export const getAdminSeasonsApi = () =>
  api.get('/admin/seasons').then(r => r.data.data as Season[])

export const createSeasonApi = (data: Partial<Season>) =>
  api.post('/admin/seasons', data).then(r => r.data.data as Season)

export const updateSeasonApi = (id: string, data: Partial<Season>) =>
  api.put(`/admin/seasons/${id}`, data).then(r => r.data.data as Season)

export const deleteSeasonApi = (id: string) =>
  api.delete(`/admin/seasons/${id}`).then(r => r.data)

// ── Extra services ────────────────────────────────────────────────────────────

export const getAdminExtraServicesApi = () =>
  api.get('/admin/extra-services').then(r => r.data.data as ExtraService[])

export const createExtraServiceApi = (data: Partial<ExtraService>) =>
  api.post('/admin/extra-services', data).then(r => r.data.data as ExtraService)

export const updateExtraServiceApi = (id: string, data: Partial<ExtraService>) =>
  api.put(`/admin/extra-services/${id}`, data).then(r => r.data.data as ExtraService)

export const deleteExtraServiceApi = (id: string) =>
  api.delete(`/admin/extra-services/${id}`).then(r => r.data)

// ── Users ─────────────────────────────────────────────────────────────────────

export const getAdminUsersApi = () =>
  api.get('/admin/users').then(r => r.data.data as AdminUser[])

export const createAdminUserApi = (data: AdminUserPayload) =>
  api.post('/admin/users', data).then(r => r.data.data as AdminUser)

export const updateAdminUserApi = (id: string, data: Partial<AdminUserPayload>) =>
  api.put(`/admin/users/${id}`, data).then(r => r.data.data as AdminUser)

export const deleteAdminUserApi = (id: string) =>
  api.delete(`/admin/users/${id}`).then(r => r.data)

// ── Roles & permissions ───────────────────────────────────────────────────────

export const getAdminRolesApi = () =>
  api.get('/admin/roles').then(r => r.data.data as { id: string; name: string; permissions: string[] }[])

export const getAdminPermissionsApi = () =>
  api.get('/admin/permissions').then(r => r.data.data as string[])

export const updateRolePermissionsApi = (roleId: string, permissions: string[]) =>
  api.put(`/admin/roles/${roleId}/permissions`, { permissions }).then(r => r.data.data)

// ── Backups ───────────────────────────────────────────────────────────────────

export const getBackupsApi = () =>
  api.get('/admin/backups').then(r => r.data.data as BackupFile[])

export interface BackupPreview {
  users:            number
  guests:           number
  companies:        number
  rooms:            number
  reservations:     number
  stays:            number
  active_stays:     number
  inventory_items:  number
  minibar_products: number
}

export const getBackupPreviewApi = () =>
  api.get('/admin/backups/preview').then(r => r.data.data as BackupPreview)

export const createBackupApi = () =>
  api.post('/admin/backups').then(r => r.data.data as BackupFile)

export const deleteAllBackupsApi = () =>
  api.delete('/admin/backups').then(r => r.data.data as { deleted: number })

export const downloadBackupApi = async (filename: string): Promise<void> => {
  const res = await api.get(
    `/admin/backups/${encodeURIComponent(filename)}/download`,
    { responseType: 'blob' },
  )
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const restoreBackupApi = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/admin/backups/restore', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const downloadMigrationKitApi = async (): Promise<void> => {
  const res = await api.get('/admin/backups/migration-kit', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kit-migracion-backups.zip'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface BackupSettings {
  auto_backup:            boolean
  auto_backup_time:       string
  auto_backup_folder:     string
  retention_days:         number
  shared_container_path?: string
  shared_host_path?:      string
}

export const getBackupSettingsApi = () =>
  api.get('/admin/backups/settings').then(r => r.data.data as BackupSettings)

export const saveBackupSettingsApi = (data: BackupSettings) =>
  api.post('/admin/backups/settings', data).then(r => r.data)

export interface BackupFolderCheck {
  using_default: boolean
  resolved_path: string
  exists:        boolean
  writable:      boolean
  message:       string
}

export const validateBackupFolderApi = (path: string) =>
  api.post('/admin/backups/validate-folder', { path }).then(r => r.data.data as BackupFolderCheck)
