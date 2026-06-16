import type { AppNotification, Room } from '@/types'

const ACTIVE_ALERT_TYPES =
  /inventory|stock|expir|maintenance|asset|repair|room_inconsistency|payment_cancelled|minibar_cancelled|daily_summary|stay_void/i

const PERSISTENT_ROOM_ALERT_TYPES = new Set(['room_cleaning', 'room_maintenance'])

function roomIdFromPayload(payload: AppNotification['payload']): string | undefined {
  return (payload as { room_id?: string } | null)?.room_id
}

function buildCleaningAlert(room: Room, existing?: AppNotification): AppNotification {
  if (existing) return existing

  return {
    id:         `room-cleaning-${room.id}`,
    user_id:    '',
    type:       'room_cleaning',
    title:      `Limpieza pendiente: Hab. ${room.number}`,
    message:    'Pendiente de limpieza.',
    severity:   'info',
    payload:    { room_id: room.id, room_number: room.number },
    action_url: '/',
    is_read:    false,
    read_at:    null,
    created_at: new Date().toISOString(),
  }
}

function buildMaintenanceAlert(room: Room, existing?: AppNotification): AppNotification {
  if (existing) return existing

  const reason = room.notes?.trim()

  return {
    id:         `room-maintenance-${room.id}`,
    user_id:    '',
    type:       'room_maintenance',
    title:      `Mantenimiento: Hab. ${room.number}`,
    message:    reason || 'Habitación en mantenimiento.',
    severity:   'warning',
    payload:    { room_id: room.id, room_number: room.number },
    action_url: `/inventory?tab=reparaciones&room_id=${room.id}`,
    is_read:    false,
    read_at:    null,
    created_at: new Date().toISOString(),
  }
}

/** Alertas operativas: limpieza y mantenimiento persisten mientras la habitación siga en ese estado. */
export function collectActiveAlerts(notifications: AppNotification[], rooms: Room[]): AppNotification[] {
  const cleaningRooms = rooms.filter((r) => r.status === 'cleaning')
  const cleaningAlerts = cleaningRooms.map((room) => {
    const existing = notifications.find(
      (n) => n.type === 'room_cleaning' && roomIdFromPayload(n.payload) === room.id,
    )
    return buildCleaningAlert(room, existing)
  })

  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance')
  const maintenanceAlerts = maintenanceRooms.map((room) => {
    const existing = notifications.find(
      (n) => n.type === 'room_maintenance' && roomIdFromPayload(n.payload) === room.id,
    )
    return buildMaintenanceAlert(room, existing)
  })

  const otherAlerts = notifications
    .filter((n) => !n.is_read && !PERSISTENT_ROOM_ALERT_TYPES.has(n.type))
    .filter((n) => n.is_modal || ACTIVE_ALERT_TYPES.test(n.type))

  return [...cleaningAlerts, ...maintenanceAlerts, ...otherAlerts].slice(0, 8)
}

export function isPersistentRoomAlert(type: string): boolean {
  return PERSISTENT_ROOM_ALERT_TYPES.has(type)
}

/** @deprecated Usar isPersistentRoomAlert */
export function isPersistentCleaningAlert(type: string): boolean {
  return isPersistentRoomAlert(type)
}
