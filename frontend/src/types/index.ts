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

// ── Houses ───────────────────────────────────────────────────────────────────

export interface House {
  id: string
  name: string
  price: string
  active: boolean
  created_at: string
  updated_at: string
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'cleaning'
  | 'maintenance'
  | 'blocked'

export interface RoomType {
  id: string
  name: string
  description: string | null
  base_price: string
  max_occupancy: number
  amenities: string[] | null
}

export interface Room {
  id: string
  hotel_id: string
  room_type_id: string
  house_id: string | null
  number: string
  floor: number | null
  status: RoomStatus
  notes: string | null
  is_active: boolean
  room_type: RoomType
  house?: House | null
  created_at: string
  updated_at: string
}

// ── Guests ────────────────────────────────────────────────────────────────────

export type DocumentType = 'cc' | 'ce' | 'passport'

export interface GuestCompanion {
  id: string
  guest_id: string
  name: string
  document_type: DocumentType | null
  document_number: string | null
  relationship: string | null
  age: number | null
}

export interface Guest {
  id: string
  full_name: string
  document_type: DocumentType
  document_number: string
  email: string | null
  phone: string | null
  nationality: string | null
  birth_date: string | null
  notes: string | null
  companions?: GuestCompanion[]
  stays_count?: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ── Companies ─────────────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  nit: string
  address: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ── Stays ─────────────────────────────────────────────────────────────────────

export type StayStatus = 'active' | 'extended' | 'checked_out'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type PaymentType = 'deposit' | 'partial' | 'final'
export type PaidBy = 'guest' | 'company' | 'mixed'

export interface StayRoom {
  id: string
  stay_id: string
  room_id: string
  room: Room
  check_in_date: string
  check_out_date: string
  price_per_night: string
  nights: number
  subtotal: string
  is_active: boolean
}

export interface ExtraService {
  id: string
  name: string
  price: string
  description: string | null
  active: boolean
}

export interface StayService {
  id: string
  stay_id: string
  extra_service_id: string
  extra_service?: ExtraService
  quantity: number
  unit_price: string
  total: string
  applied_at: string
  applied_by: string
}

export interface Payment {
  id: string
  stay_id: string
  amount: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  paid_by: PaidBy
  payment_split_details: Record<string, unknown> | null
  receipt_path: string | null
  receptionist_id: string
  payment_date: string
  notes: string | null
  created_at: string
}

export interface Stay {
  id: string
  guest_id: string
  company_id: string | null
  reservation_id: string | null
  status: StayStatus
  check_in_datetime: string
  check_out_datetime: string
  actual_check_out_datetime: string | null
  late_checkout_fee: string | null
  total_amount: string | null
  paid_amount: string
  notes: string | null
  receipt_number: string | null
  guest?: Guest
  company?: Company | null
  stay_rooms?: StayRoom[]
  stay_guests?: StayGuest[]
  payments?: Payment[]
  services?: StayService[]
  minibar_consumptions?: MinibarConsumption[]
  created_at: string
  updated_at: string
}

// ── Stay guests ───────────────────────────────────────────────────────────────

export interface StayGuest {
  id: string
  stay_id: string
  guest_id: string
  is_primary: boolean
  guest?: Guest
  created_at: string
  updated_at: string
}

// ── Check-in wizard payload ───────────────────────────────────────────────────

export interface CheckInPayload {
  guest_id: string
  company_id?: string
  room_ids: string[]
  check_in_datetime: string
  check_out_datetime: string
  prices: Record<string, number>
  notes?: string
  additional_guest_ids?: string[]
}

// ── Reservations ─────────────────────────────────────────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show'
export type ReservationPaymentStatus = 'pending' | 'partial' | 'paid'

export interface ReservationPayment {
  id: string
  reservation_id: string
  amount: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  receptionist_id: string
  payment_date: string
  notes: string | null
  created_at: string
}

export interface Reservation {
  id: string
  guest_id: string | null
  company_id: string | null
  room_id: string | null
  house_id: string | null
  status: ReservationStatus
  start_date: string
  end_date: string
  nights: number
  agreed_price: string
  deposit_amount: string | null
  payment_status: ReservationPaymentStatus
  created_by: string
  notes: string | null
  guest?: Guest | null
  company?: Company | null
  room?: Room | null
  house?: House | null
  payments?: ReservationPayment[]
  stay?: Stay | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ReservationPayload {
  guest_id?: string
  company_id?: string
  room_id?: string
  house_id?: string
  start_date: string
  end_date: string
  agreed_price: number
  deposit_amount?: number
  notes?: string
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  multiplier: string
  active: boolean
  created_at: string
  updated_at: string
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarRoom {
  id: string
  number: string
  status: RoomStatus
  room_type: string | null
  house: string | null
}

export interface CalendarEntry {
  id: string
  type: 'reservation' | 'stay'
  room_id: string | null
  house_id: string | null
  status: string
  start_date: string
  end_date: string
  nights: number
  guest_name: string | null
  company_name: string | null
  agreed_price: string
}

export interface CalendarData {
  rooms: CalendarRoom[]
  reservations: CalendarEntry[]
  stays: CalendarEntry[]
}

// ── Minibar ───────────────────────────────────────────────────────────────────

export type MinibarConsumptionType = 'consumed' | 'damaged' | 'missing'

export interface MinibarConsumption {
  id: string
  stay_id: string
  room_id: string
  product_name: string
  quantity: number
  type: MinibarConsumptionType
  unit_price: string
  total: string
  registered_at: string
  registered_by: string
  created_at: string
  updated_at: string
}

export interface MinibarItem {
  product_name: string
  room_id: string
  type: MinibarConsumptionType
  quantity: number
  unit_price: number
}

// ── Stay account breakdown ────────────────────────────────────────────────────

export interface AccountRoom {
  room_number: string
  room_type: string
  price_per_night: number
  nights: number
  subtotal: number
  is_active: boolean
}

export interface AccountService {
  name: string
  quantity: number
  unit_price: number
  total: number
}

export interface AccountMinibar {
  product_name: string
  type: MinibarConsumptionType
  quantity: number
  unit_price: number
  total: number
}

export interface StayAccount {
  rooms: AccountRoom[]
  services: AccountService[]
  minibar: AccountMinibar[]
  late_checkout_fee: number
  subtotal: number
  iva_pct: number
  iva_amount: number
  total: number
  paid_amount: number
  balance: number
}

// ── Inventory ────────────────────────────────────────────────────────────────

export type InventoryCategoryType = 'consumable' | 'asset' | 'cleaning'

export interface InventoryCategory {
  id: string
  name: string
  type: InventoryCategoryType
  active: boolean
  created_at: string
  updated_at: string
}

export type InventoryTransactionType =
  | 'entry'
  | 'exit_to_minibar'
  | 'exit_to_housekeeping'
  | 'adjustment'
  | 'sale'

export interface InventoryTransaction {
  id: string
  inventory_item_id: string
  type: InventoryTransactionType
  quantity: number
  unit_price: string
  total_value: string
  performed_by: string
  destination_room_id: string | null
  destination_user_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  performed_by_user?: { id: string; name: string }
  destination_room?: { id: string; number: string } | null
  destination_user?: { id: string; name: string } | null
}

export interface InventoryItem {
  id: string
  category_id: string
  code: string
  name: string
  brand: string | null
  presentation: string | null
  unit: string
  cost_price: string
  sale_price: string | null
  current_stock: number
  min_stock_threshold: number
  expiry_date: string | null
  supplier: string | null
  invoice_number: string | null
  location: string | null
  active: boolean
  category?: InventoryCategory
  transactions?: InventoryTransaction[]
  created_at: string
  updated_at: string
}

// ── Minibar products ─────────────────────────────────────────────────────────

export interface MinibarProduct {
  id: string
  name: string
  inventory_item_id: string | null
  sale_price: string
  cost_price: string
  damage_price: string | null
  description: string | null
  active: boolean
  inventory_item?: InventoryItem | null
  created_at: string
  updated_at: string
}

export interface RoomMinibar {
  id: string
  room_id: string
  minibar_product_id: string
  quantity: number
  last_restocked_at: string | null
  restocked_by: string | null
  product?: MinibarProduct
  restocked_by_user?: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

// ── Assets ────────────────────────────────────────────────────────────────────

export type AssetLocationType = 'room' | 'general'
export type AssetStatus = 'active' | 'maintenance' | 'retired'
export type MaintenanceStatus = 'pending' | 'completed' | 'cancelled'
export type RepairOrderStatus = 'pending' | 'in_progress' | 'completed'

export interface Asset {
  id: string
  asset_code: string
  name: string
  brand: string | null
  model: string | null
  serial_number: string | null
  location_type: AssetLocationType
  room_id: string | null
  purchase_date: string | null
  warranty_expiry: string | null
  status: AssetStatus
  room?: Room | null
  created_at: string
  updated_at: string
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  scheduled_date: string
  completed_date: string | null
  description: string
  cost: string | null
  technician_id: string | null
  next_maintenance_date: string | null
  status: MaintenanceStatus
  asset?: Asset
  technician?: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export interface RepairOrder {
  id: string
  asset_id: string | null
  room_id: string | null
  description: string
  reported_by: string
  assigned_to: string | null
  cost: string | null
  status: RepairOrderStatus
  completed_at: string | null
  asset?: Asset | null
  room?: Room | null
  reported_by_user?: { id: string; name: string }
  assigned_to_user?: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  payload: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

// ── Activity log ──────────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string
  action: string
  action_label: string
  user_id: string | null
  user_name: string
  payload: Record<string, unknown> | null
  created_at: string
}

// ── Suggestions ───────────────────────────────────────────────────────────────

export type SuggestionType = 'minibar_restock' | 'price_adjustment' | 'corporate_rate'

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  confidence_score: string
  data: Record<string, unknown> | null
  dismissed: boolean
  dismissed_by: string | null
  created_at: string
  updated_at: string
}

// ── Payment history ───────────────────────────────────────────────────────────

export interface PaymentHistoryEntry {
  id: string
  stay_id: string
  guest_name: string
  amount: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  paid_by: PaidBy
  receptionist: string
  payment_date: string
  notes: string | null
}

// ── Admin — Users ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  is_active: boolean
  role: string | null
  created_at: string
}

export interface AdminUserPayload {
  name: string
  email: string
  password?: string
  role: string
  is_active?: boolean
}

// ── Admin — Backups ───────────────────────────────────────────────────────────

export interface BackupFile {
  filename: string
  size: number
  created_at: string
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  rooms_by_status: Record<RoomStatus, number>
  total_rooms: number
  occupied: number
  available: number
  cleaning: number
  checkins_today: number
  active_stays: number
  pending_balance: number
}
