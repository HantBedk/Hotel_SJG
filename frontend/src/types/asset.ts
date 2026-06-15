import type { Room } from './room'

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
