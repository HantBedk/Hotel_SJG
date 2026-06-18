import type { ActivityLogEntry } from '@/types'
import { formatDateMedium } from '@/lib/formatDate'
import { ACTION_LABELS, METHOD_LABELS, PAYLOAD_LABELS, ROLE_LABELS, STATUS_LABELS } from '../constants/activityLogLabels'

export interface ActivityDetailRow {
  key: string
  label: string
  value: string
}

const HIDDEN_PAYLOAD_KEYS = new Set([
  'room_id',
  'stay_id',
  'guest_id',
  'payment_id',
  'reservation_id',
  'from_room_id',
  'to_room_id',
  'room_ids',
  'old_status',
  'new_status',
  'room_number',
])

const REASON_LABELS: Record<string, string> = {
  checkout: 'Check-out',
}

const MINIBAR_TYPE_LABELS: Record<string, string> = {
  consumed: 'Consumido',
  damaged: 'Dañado',
  missing: 'Faltante',
}

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  checked_in: 'En estadía',
  cancelled: 'Cancelada',
  no_show: 'No show',
}

const BILLING_MODE_LABELS: Record<string, string> = {
  single: 'Factura única',
  individual: 'Factura por habitación',
}

interface MinibarItemPayload {
  product_name?: string
  quantity?: number
  type?: string
  room_number?: string | number | null
  total?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMinibarItemRecord(value: unknown): value is MinibarItemPayload {
  return isRecord(value) && typeof value.product_name === 'string'
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`
}

function formatDateValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return formatDateMedium(value)
}

function isReservationAction(action: string): boolean {
  return action.startsWith('reservation.')
}

function appendReservationRows(payload: Record<string, unknown>, rows: ActivityDetailRow[]): void {
  const guestName = payload.guest_name
  if (typeof guestName === 'string') {
    rows.push({ key: 'guest_name', label: 'Huésped', value: guestName })
  }

  const companyName = payload.company_name
  if (typeof companyName === 'string') {
    rows.push({ key: 'company_name', label: 'Empresa', value: companyName })
  }

  const roomNumber = payload.room_number
  if (typeof roomNumber === 'string' || typeof roomNumber === 'number') {
    rows.push({ key: 'room', label: 'Habitación', value: `Hab. ${roomNumber}` })
  }

  const roomsLabel = formatRoomsList(payload.rooms)
  if (roomsLabel) {
    rows.push({ key: 'rooms', label: 'Habitaciones', value: roomsLabel })
  } else if (typeof payload.room_count === 'number') {
    rows.push({ key: 'room_count', label: 'Habitaciones', value: String(payload.room_count) })
  }

  const startDate = formatDateValue(payload.start_date)
  if (startDate) rows.push({ key: 'start_date', label: 'Llegada', value: startDate })

  const endDate = formatDateValue(payload.end_date)
  if (endDate) rows.push({ key: 'end_date', label: 'Salida', value: endDate })

  if (typeof payload.nights === 'number') {
    rows.push({ key: 'nights', label: 'Noches', value: String(payload.nights) })
  }

  if (typeof payload.agreed_price === 'number') {
    rows.push({ key: 'agreed_price', label: 'Precio acordado', value: formatCurrency(payload.agreed_price) })
  }

  if (typeof payload.deposit_amount === 'number' && payload.deposit_amount > 0) {
    rows.push({ key: 'deposit_amount', label: 'Abono', value: formatCurrency(payload.deposit_amount) })
  }

  const status = payload.status
  if (typeof status === 'string') {
    rows.push({
      key: 'status',
      label: 'Estado',
      value: RESERVATION_STATUS_LABELS[status] ?? formatStatusLabel(status),
    })
  }

  const billingMode = payload.billing_mode
  if (typeof billingMode === 'string') {
    rows.push({
      key: 'billing_mode',
      label: 'Facturación',
      value: BILLING_MODE_LABELS[billingMode] ?? billingMode,
    })
  }

  const reason = payload.reason ?? payload.notes
  if (typeof reason === 'string' && reason.trim()) {
    rows.push({ key: 'reason', label: 'Motivo', value: reason })
  }
}

function formatMinibarItemLine(item: MinibarItemPayload): string {
  const name = item.product_name ?? 'Producto'
  const qty = item.quantity ?? 1
  const type = item.type ? (MINIBAR_TYPE_LABELS[item.type] ?? item.type) : null
  const total = typeof item.total === 'number' ? ` — ${formatCurrency(item.total)}` : ''
  const typePart = type ? ` (${type})` : ''
  return `${name} × ${qty}${typePart}${total}`
}

function formatRoomsList(rooms: unknown): string | null {
  if (!Array.isArray(rooms) || rooms.length === 0) return null
  const formatted = rooms
    .filter((room): room is string | number => typeof room === 'string' || typeof room === 'number')
    .map((room) => `Hab. ${room}`)
    .join(', ')
  return formatted || null
}

function appendMinibarItemRows(items: unknown, rows: ActivityDetailRow[]): void {
  if (!Array.isArray(items)) return

  const validItems = items.filter(isMinibarItemRecord)
  validItems.forEach((item, index) => {
    const roomPrefix = item.room_number ? `Hab. ${item.room_number} · ` : ''
    rows.push({
      key: `item-${index}`,
      label: validItems.length === 1 ? 'Producto' : `Producto ${index + 1}`,
      value: `${roomPrefix}${formatMinibarItemLine(item)}`,
    })
  })
}

function appendMinibarActionRows(payload: Record<string, unknown>, rows: ActivityDetailRow[]): void {
  const guestName = payload.guest_name
  if (typeof guestName === 'string') {
    rows.push({ key: 'guest_name', label: 'Huésped', value: guestName })
  }

  const roomsLabel = formatRoomsList(payload.rooms)
  if (roomsLabel) {
    rows.push({ key: 'rooms', label: 'Habitaciones', value: roomsLabel })
  }

  appendMinibarItemRows(payload.items, rows)

  if (typeof payload.total === 'number') {
    rows.push({ key: 'total', label: 'Total', value: formatCurrency(payload.total) })
  }
}

function appendMinibarCancelledRows(payload: Record<string, unknown>, rows: ActivityDetailRow[]): void {
  const roomNumber = payload.room_number
  if (typeof roomNumber === 'string' || typeof roomNumber === 'number') {
    rows.push({ key: 'room', label: 'Habitación', value: `Hab. ${roomNumber}` })
  }

  const productName = payload.product_name
  const quantity = payload.quantity
  if (typeof productName === 'string') {
    const qty = typeof quantity === 'number' ? ` × ${quantity}` : ''
    rows.push({ key: 'product_name', label: 'Producto', value: `${productName}${qty}` })
  }

  if (typeof payload.amount === 'number') {
    rows.push({ key: 'amount', label: 'Monto', value: formatCurrency(payload.amount) })
  }

  const reason = payload.reason
  if (typeof reason === 'string' && reason.trim()) {
    rows.push({ key: 'reason', label: 'Motivo', value: reason })
  }
}

function formatPrimitiveValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toLocaleString('es-CO')
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value)) return value.map(formatPrimitiveValue).join(', ')
  return JSON.stringify(value)
}

export function formatStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function formatUserRole(role: string | null | undefined): string | null {
  if (!role) return null
  return ROLE_LABELS[role] ?? role
}

export function formatActivityUserRole(log: ActivityLogEntry): string | null {
  if (log.user_role_label) return log.user_role_label
  return formatUserRole(log.user_role)
}

function formatPayloadStringKey(key: string, value: string): string | null {
  if (key === 'method') return METHOD_LABELS[value] ?? value
  if (key === 'type') return MINIBAR_TYPE_LABELS[value] ?? STATUS_LABELS[value] ?? value
  if (key === 'old_status' || key === 'new_status') return formatStatusLabel(value)
  if (key === 'reason') return REASON_LABELS[value] ?? value
  return null
}

export function formatPayloadValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (key === 'items' && Array.isArray(value)) {
    return value.filter(isMinibarItemRecord).map(formatMinibarItemLine).join(' · ') || '—'
  }
  if (key === 'rooms' && Array.isArray(value)) {
    return formatRoomsList(value) ?? '—'
  }
  if (Array.isArray(value)) return value.map((item) => formatPayloadValue(key, item)).join(', ')
  if (typeof value === 'string') {
    const dateLabel = (key === 'start_date' || key === 'end_date') ? formatDateMedium(value) : null
    if (dateLabel && dateLabel !== value) return dateLabel
    return formatPayloadStringKey(key, value) ?? value
  }
  if ((key === 'amount' || key === 'total' || key === 'total_amount' || key === 'agreed_price' || key === 'deposit_amount')
    && typeof value === 'number') {
    return formatCurrency(value)
  }
  return formatPrimitiveValue(value)
}

function roomNumberFromLog(log: ActivityLogEntry): string | null {
  const payload = log.payload
  const fromPayload = payload?.room_number
  if (typeof fromPayload === 'string' || typeof fromPayload === 'number') {
    return String(fromPayload)
  }
  return log.room_label
}

function isRoomLifecycleAction(action: string): boolean {
  return action.startsWith('room.')
    || action === 'room_created'
    || action === 'room_updated'
    || action === 'room_deactivated'
    || action === 'room_status_changed'
}

function appendRoomStatusRows(log: ActivityLogEntry, rows: ActivityDetailRow[]): void {
  const payload = log.payload ?? {}
  const roomNumber = roomNumberFromLog(log)
  if (roomNumber) {
    rows.push({ key: 'room', label: 'Habitación', value: `Hab. ${roomNumber}` })
  }

  const oldStatus = typeof payload.old_status === 'string' ? payload.old_status : null
  const newStatus = typeof payload.new_status === 'string' ? payload.new_status : null

  if (oldStatus && newStatus) {
    rows.push({
      key: 'status_change',
      label: 'Cambio de estado',
      value: `De ${formatStatusLabel(oldStatus)} a ${formatStatusLabel(newStatus)}`,
    })
    return
  }

  if (newStatus) {
    rows.push({
      key: 'new_status',
      label: 'Estado',
      value: formatStatusLabel(newStatus),
    })
  }
}

function appendGenericPayloadRows(
  payload: Record<string, unknown>,
  rows: ActivityDetailRow[],
  skipKeys: Set<string>,
): void {
  for (const [key, value] of Object.entries(payload)) {
    if (skipKeys.has(key) || HIDDEN_PAYLOAD_KEYS.has(key) || key.endsWith('_id')) continue
    if (rows.some((row) => row.key === key)) continue

    rows.push({
      key,
      label: PAYLOAD_LABELS[key] ?? key.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
      value: formatPayloadValue(key, value),
    })
  }
}

/** Filas legibles para el modal de detalle (sin UUIDs ni claves técnicas). */
export function buildActivityDetailRows(log: ActivityLogEntry): ActivityDetailRow[] {
  const payload = log.payload
  if (!payload || Object.keys(payload).length === 0) return []

  const rows: ActivityDetailRow[] = []
  const handled = new Set<string>()

  if (isRoomLifecycleAction(log.action)) {
    appendRoomStatusRows(log, rows)
    rows.forEach((row) => handled.add(row.key))
    handled.add('reason')
    appendGenericPayloadRows(payload, rows, handled)
    return rows
  }

  if (log.action === 'stay.transfer') {
    const from = payload.from_room_number ?? payload.from_room
    const to = payload.to_room_number ?? payload.to_room
    if (from || to) {
      rows.push({
        key: 'transfer',
        label: 'Transferencia',
        value: `De Hab. ${from ?? '—'} a Hab. ${to ?? '—'}`,
      })
      handled.add('transfer')
    }
  }

  if (log.action === 'stay.minibar') {
    appendMinibarActionRows(payload, rows)
    rows.forEach((row) => handled.add(row.key))
    handled.add('items')
    appendGenericPayloadRows(payload, rows, handled)
    return rows
  }

  if (log.action === 'stay.minibar_cancelled') {
    appendMinibarCancelledRows(payload, rows)
    rows.forEach((row) => handled.add(row.key))
    appendGenericPayloadRows(payload, rows, handled)
    return rows
  }

  if (isReservationAction(log.action)) {
    appendReservationRows(payload, rows)
    rows.forEach((row) => handled.add(row.key))
    handled.add('room_number')
    appendGenericPayloadRows(payload, rows, handled)
    return rows
  }

  appendGenericPayloadRows(payload, rows, handled)
  return rows
}

/** Título legible para la card de actividad reciente del dashboard. */
function formatRoomStatusCardTitle(
  roomPrefix: string | null,
  oldStatus: string | null,
  newStatus: string | null,
): string | null {
  if (roomPrefix && oldStatus && newStatus) {
    return `${roomPrefix}: ${formatStatusLabel(oldStatus)} → ${formatStatusLabel(newStatus)}`
  }
  return null
}

function formatRoomLifecycleCardTitle(log: ActivityLogEntry, roomPrefix: string | null): string | null {
  if (log.action === 'room_created' && roomPrefix) {
    return `Habitación creada — ${roomPrefix}`
  }
  if (log.action === 'room_deactivated' && roomPrefix) {
    return `Habitación desactivada — ${roomPrefix}`
  }
  return null
}

function formatTransferCardTitle(payload: Record<string, unknown>): string | null {
  const from = payload.from_room_number ?? payload.from_room
  const to = payload.to_room_number ?? payload.to_room
  if (typeof from !== 'string' && typeof from !== 'number') return null
  if (typeof to !== 'string' && typeof to !== 'number') return null
  return `Transferencia: Hab. ${from} → Hab. ${to}`
}

function formatMinibarCardTitle(payload: Record<string, unknown>): string | null {
  if (!Array.isArray(payload.items)) return null
  const items = payload.items.filter(isMinibarItemRecord)
  if (items.length === 0) return null

  const summary = items.slice(0, 2).map((item) => item.product_name).join(', ')
  const extra = items.length > 2 ? ` +${items.length - 2}` : ''
  const guestName = typeof payload.guest_name === 'string' ? payload.guest_name : null
  if (guestName) return `Minibar: ${summary}${extra} — ${guestName}`
  return `Minibar: ${summary}${extra}`
}

function formatReservationCardTitle(log: ActivityLogEntry, payload: Record<string, unknown>): string | null {
  if (!isReservationAction(log.action)) return null

  const guestName = typeof payload.guest_name === 'string' ? payload.guest_name : null
  const start = formatDateValue(payload.start_date)
  const end = formatDateValue(payload.end_date)
  const roomNumber = payload.room_number
  const roomPart = (typeof roomNumber === 'string' || typeof roomNumber === 'number')
    ? ` · Hab. ${roomNumber}`
    : ''

  if (guestName && start && end) {
    return `Reserva: ${guestName}${roomPart} · ${start} → ${end}`
  }
  if (guestName) {
    return `Reserva: ${guestName}${roomPart}`
  }

  const base = ACTION_LABELS[log.action] ?? log.action_label ?? log.action
  if (start && end) return `${base} · ${start} → ${end}`
  return null
}

function formatDefaultCardTitle(
  log: ActivityLogEntry,
  payload: Record<string, unknown>,
  roomPrefix: string | null,
): string {
  const guestName = typeof payload.guest_name === 'string' ? payload.guest_name : null
  const base = ACTION_LABELS[log.action] ?? log.action_label ?? log.action

  if (guestName) return `${base} — ${guestName}`
  if (roomPrefix) return `${base} — ${roomPrefix}`
  return base
}

export function formatActivityCardTitle(log: ActivityLogEntry): string {
  const payload = log.payload ?? {}
  const room = roomNumberFromLog(log)
  const roomPrefix = room ? `Hab. ${room}` : null
  const oldStatus = typeof payload.old_status === 'string' ? payload.old_status : null
  const newStatus = typeof payload.new_status === 'string' ? payload.new_status : null

  const statusTitle = formatRoomStatusCardTitle(roomPrefix, oldStatus, newStatus)
  if (statusTitle) return statusTitle

  const lifecycleTitle = formatRoomLifecycleCardTitle(log, roomPrefix)
  if (lifecycleTitle) return lifecycleTitle

  if (log.action === 'stay.transfer') {
    const transferTitle = formatTransferCardTitle(payload)
    if (transferTitle) return transferTitle
  }

  if (log.action === 'stay.minibar') {
    const minibarTitle = formatMinibarCardTitle(payload)
    if (minibarTitle) return minibarTitle
  }

  const reservationTitle = formatReservationCardTitle(log, payload)
  if (reservationTitle) return reservationTitle

  return formatDefaultCardTitle(log, payload, roomPrefix)
}

/** Subtítulo de la card (usuario y rol en español). */
export function formatActivityCardSubtitle(log: ActivityLogEntry): string {
  const role = formatActivityUserRole(log)
  if (role) return `${log.user_name} · ${role}`
  return log.user_name
}
