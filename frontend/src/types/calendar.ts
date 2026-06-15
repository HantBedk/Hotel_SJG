import type { RoomStatus } from './room'

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
  group_id?: string | null
}

export interface CalendarData {
  rooms: CalendarRoom[]
  reservations: CalendarEntry[]
  stays: CalendarEntry[]
}
