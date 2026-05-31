// ── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message: string
  errors: Record<string, string[]>
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

// ── Roles / Permisos ─────────────────────────────────────────────────────────

export type Role =
  | 'superadmin'
  | 'admin'
  | 'receptionist'
  | 'housekeeping'
  | 'maintenance'

export type Permission =
  | 'view_dashboard'
  | 'view_rooms'
  | 'manage_rooms'
  | 'view_reservations'
  | 'manage_reservations'
  | 'check_in'
  | 'check_out'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_settings'
  | 'manage_settings'
  | 'view_activity_log'
  | 'manage_users'
  | 'manage_roles'
  | 'trigger_backup'
  | 'restore_backup'
  | 'view_reports'

// ── Settings ─────────────────────────────────────────────────────────────────

export interface Setting {
  key: string
  value: string
  type: 'string' | 'boolean' | 'integer' | 'json'
  group: string
}
