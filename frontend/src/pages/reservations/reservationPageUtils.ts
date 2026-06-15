import type { Reservation, ReservationPaymentStatus, ReservationStatus } from '@/types'

export { formatDateMedium as formatReservationDate, formatDateRange as formatReservationDateRange } from '@/lib/formatDate'

export type ReservationGroupKey = 'active' | 'in_stay' | 'closed'

export const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: '#F59E0B' },
  confirmed:  { label: 'Confirmada',  color: '#0EA5E9' },
  checked_in: { label: 'En estadía',  color: '#22C55E' },
  cancelled:  { label: 'Cancelada',   color: '#94A3B8' },
  no_show:    { label: 'No show',     color: '#EF4444' },
}

export const PAYMENT_CONFIG: Record<ReservationPaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Pago pendiente', color: '#F59E0B' },
  partial: { label: 'Pago parcial',   color: '#8B5CF6' },
  paid:    { label: 'Pagado',         color: '#22C55E' },
}

export const FILTER_STATUSES: { key: ReservationStatus | ''; label: string }[] = [
  { key: '',           label: 'Todas' },
  { key: 'pending',    label: 'Pendientes' },
  { key: 'confirmed',  label: 'Confirmadas' },
  { key: 'checked_in', label: 'En estadía' },
  { key: 'cancelled',  label: 'Canceladas' },
  { key: 'no_show',    label: 'No show' },
]

export function isActiveReservation(status: ReservationStatus): boolean {
  return status === 'pending' || status === 'confirmed'
}

export function getReservationGroup(status: ReservationStatus): ReservationGroupKey {
  if (isActiveReservation(status)) return 'active'
  if (status === 'checked_in') return 'in_stay'
  return 'closed'
}

export function filterReservationsByGroup(
  reservations: Reservation[],
  group: ReservationGroupKey | '',
): Reservation[] {
  if (!group) return reservations
  if (group === 'active') return reservations.filter((r) => isActiveReservation(r.status))
  if (group === 'in_stay') return reservations.filter((r) => r.status === 'checked_in')
  return reservations.filter((r) => r.status === 'cancelled' || r.status === 'no_show')
}

export function countReservationsByGroup(
  reservations: Reservation[],
  group: ReservationGroupKey,
): number {
  return filterReservationsByGroup(reservations, group).length
}

export function formatCurrency(value: string | number): string {
  return `$${Number(value).toLocaleString('es-CO')}`
}

export function nightLabel(n: number): string {
  return `${n} noche${n === 1 ? '' : 's'}`
}

export function reservationGuestLabel(res: Reservation): string {
  return res.guest?.full_name ?? res.company?.name ?? 'Sin huésped'
}

export function reservationRoomLabel(res: Reservation): string | null {
  if (res.room?.number) return `Hab. ${res.room.number}`
  if (res.house?.name) return res.house.name
  return null
}
