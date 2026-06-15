import type { MinibarConsumptionType } from './minibar'

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
