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
  | 'view_rooms'
  | 'manage_rooms'
  | 'view_stays'
  | 'create_stays'
  | 'manage_stays'
  | 'transfer_guest'
  | 'view_guests'
  | 'manage_guests'
  | 'view_reservations'
  | 'manage_reservations'
  | 'view_payments'
  | 'manage_payments'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_users'
  | 'view_audit'
