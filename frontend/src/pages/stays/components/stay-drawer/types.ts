import type { MinibarConsumptionType, MinibarItem, Stay } from '@/types'

export interface StayDrawerProps {
  readonly stayId: string
  readonly initialStay: Stay
  readonly onClose: () => void
  readonly canCheckOut: boolean
  readonly onCheckOut: (id: string) => void
  readonly onAddPayment: (payload: {
    stayId: string
    amount: number
    payment_method: string
    payment_type: string
    paid_by: string
    notes?: string
  }) => void
  readonly onAddService: (payload: { stayId: string; extra_service_id: string; quantity: number }) => void
  readonly onAddMinibar: (payload: { stayId: string; items: MinibarItem[] }) => Promise<unknown>
  readonly onTransfer: (payload: { stayId: string; from_room_id: string; to_room_id: string; reason?: string }) => Promise<unknown>
  readonly onExtend: (payload: { id: string; check_out_datetime: string }) => Promise<unknown>
}

export interface PaymentForm {
  amount: string
  payment_method: string
  payment_type: string
  paid_by: string
  notes: string
}

export interface TransferForm {
  from_room_id: string
  to_room_id: string
  reason: string
}

export interface MinibarRow {
  id: string
  minibar_product_id: string
  query: string
  showList: boolean
  room_id: string
  type: MinibarConsumptionType
  quantity: string
  unit_price: string
}
