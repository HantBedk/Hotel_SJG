import type { Stay } from '@/types'

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Activa', color: 'var(--status-occupied)', bg: '#FFF1F2' },
  extended: { label: 'Extendida', color: 'var(--status-reserved)', bg: '#FFFBEB' },
  checked_out: { label: 'Cerrada', color: 'var(--text-muted)', bg: 'var(--bg-input)' },
  void_pending: { label: 'Anulación pendiente', color: '#92400E', bg: '#FEF3C7' },
  voided: { label: 'Anulada', color: '#991B1B', bg: '#FEE2E2' },
  void_rejected: { label: 'Anulación rechazada', color: '#475569', bg: '#F1F5F9' },
}

export const STAY_FILTERS = [
  { key: 'active', label: 'Activas' },
  { key: 'checked_out', label: 'Cerradas' },
  { key: 'void_pending', label: 'Anulación pendiente' },
  { key: 'voided', label: 'Anuladas' },
  { key: 'void_rejected', label: 'Anulación rechazada' },
] as const

export const STAY_TABLE_HEADERS = [
  'Huésped', 'Habitaciones', 'Entrada', 'Salida prevista', 'Total', 'Pagado', 'Estado', '',
] as const

export const STAY_SKELETON_KEYS = [
  'stay-skeleton-a',
  'stay-skeleton-b',
  'stay-skeleton-c',
  'stay-skeleton-d',
  'stay-skeleton-e',
] as const

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatCurrency(amount: string | number | null | undefined): string {
  if (amount == null) return '—'
  return `$${Number(amount).toLocaleString('es-CO')}`
}

export function toStayList(raw: unknown): Stay[] {
  if (!Array.isArray(raw)) return []
  return raw as Stay[]
}

export function filterStaysByGuest(stays: Stay[], query: string): Stay[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return stays
  return stays.filter((s) =>
    s.guest?.full_name?.toLowerCase().includes(normalized) ||
    s.company?.name?.toLowerCase().includes(normalized),
  )
}

export function stayStatusConfig(status: string) {
  return STATUS_LABELS[status] ?? STATUS_LABELS.active
}

export function emptyStaysLabel(statusFilter: string): string {
  if (statusFilter === 'active') return 'activas'
  if (statusFilter === 'void_pending') return 'con anulación pendiente'
  if (statusFilter === 'voided') return 'anuladas'
  if (statusFilter === 'void_rejected') return 'con anulación rechazada'
  return 'cerradas'
}

export function activeRoomNumbers(stay: Stay): string {
  const numbers = stay.stay_rooms
    ?.filter((sr) => sr.is_active)
    .map((sr) => sr.room?.number)
    .filter(Boolean)
  if (!numbers?.length) return '—'
  return numbers.join(', ')
}
