export interface HotelSummary {
  id: string
  name: string
  city: string | null
  logo_url: string | null
}

export interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
  hotels: HotelSummary[]
  can_switch_hotel: boolean
  current_hotel_id: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

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
  | 'view_hotels'
  | 'manage_hotels'
