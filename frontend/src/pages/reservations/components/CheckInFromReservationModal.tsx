import { useState } from 'react'
import { X, BedDouble, CheckCircle } from 'lucide-react'
import { useReservations } from '@/hooks/useReservations'
import { useHotelTimes } from '@/hooks/useHotelTimes'
import { todayLocalISO } from '@/lib/format'
import type { Reservation, Room } from '@/types'

interface Props {
  reservation: Reservation
  rooms: Room[]
  onClose: () => void
  onSuccess?: () => void
}

export default function CheckInFromReservationModal({ reservation, rooms, onClose, onSuccess }: Props) {
  // "Hoy" en TZ local del browser (no UTC). Si usáramos toISOString().slice(0,10)
  // después de las 19:00 de Bogotá quedaríamos guardando el check-in con fecha
  // de mañana, dejando la habitación fuera del KPI de ingresos de hoy.
  const today = todayLocalISO()

  const availableRooms = rooms.filter(r => ['available', 'reserved'].includes(r.status) && r.is_active)

  // La reserva guarda la habitación originalmente asignada (reservation.room_id).
  // Pre-seleccionamos esa habitación y calculamos el precio por noche a partir
  // del precio total acordado y las noches reservadas, así recepción no tiene
  // que volver a elegirla ni re-teclear el precio.
  const reservedRoomId = reservation.room_id
  const reservedRoomAvailable = !!reservedRoomId && availableRooms.some(r => r.id === reservedRoomId)
  const pricePerNight = reservation.nights > 0
    ? Number(reservation.agreed_price ?? 0) / reservation.nights
    : 0

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(
    reservedRoomAvailable && reservedRoomId ? [reservedRoomId] : [],
  )
  const [prices, setPrices] = useState<Record<string, string>>(
    reservedRoomAvailable && reservedRoomId
      ? { [reservedRoomId]: pricePerNight > 0 ? String(Math.round(pricePerNight)) : '' }
      : {},
  )
  const [checkIn, setCheckIn]                 = useState(today)
  // reservation.end_date viene como ISO datetime ("2026-06-23T05:00:00Z"); el
  // input[type=date] sólo acepta "YYYY-MM-DD", así que tomamos sólo la fecha.
  const [checkOut, setCheckOut]               = useState((reservation.end_date ?? '').slice(0, 10))

  const { checkIn: doCheckIn, isCheckingIn } = useReservations()
  const { checkInTime, checkOutTime }        = useHotelTimes()

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    )
  }

  const handleSubmit = async () => {
    const pricesPayload: Record<string, number> = {}
    for (const id of selectedRoomIds) {
      pricesPayload[id] = Number(prices[id] ?? 0)
    }

    await doCheckIn({
      id:                 reservation.id,
      room_ids:           selectedRoomIds,
      prices:             pricesPayload,
      check_in_datetime:  `${checkIn}T${checkInTime}:00`,
      check_out_datetime: `${checkOut}T${checkOutTime}:00`,
    })
    onSuccess?.()
  }

  const canSubmit = selectedRoomIds.length > 0 && selectedRoomIds.every(id => Number(prices[id] ?? 0) >= 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Check-in desde reserva</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {reservation.guest?.full_name ?? '—'} · {reservation.nights} noche(s)
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Check-in</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Check-out</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          {/* Room selection */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Seleccionar habitación(es)</p>
            {availableRooms.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay habitaciones disponibles.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Mostrar primero la habitación reservada para que recepción la vea de una. */}
                {[...availableRooms].sort((a, b) => {
                  if (a.id === reservedRoomId) return -1
                  if (b.id === reservedRoomId) return 1
                  return 0
                }).map(room => {
                  const selected = selectedRoomIds.includes(room.id)
                  const isReserved = room.id === reservedRoomId
                  return (
                    <div
                      key={room.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                      style={{
                        background: 'var(--bg-main)',
                        border: selected ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
                      }}
                      onClick={() => toggleRoom(room.id)}
                    >
                      <BedDouble size={16} style={{ color: selected ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Hab. {room.number}
                            {room.house && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>· {room.house.name}</span>}
                          </p>
                          {isReserved && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                            >
                              Reservada
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{room.room_type?.name}</p>
                      </div>
                      {selected && (
                        <input
                          type="number"
                          min="0"
                          className="w-28 px-2 py-1 rounded text-sm border text-right"
                          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                          placeholder="Precio/noche"
                          value={prices[room.id] ?? ''}
                          onChange={e => setPrices(p => ({ ...p, [room.id]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isCheckingIn}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <CheckCircle size={16} />
            {isCheckingIn ? 'Procesando...' : 'Confirmar check-in'}
          </button>
        </div>
      </div>
    </div>
  )
}
