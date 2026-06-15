import { useState, useEffect } from 'react'
import { X, BedDouble, CheckCircle } from 'lucide-react'
import { useReservations } from '@/hooks/useReservations'
import { useHotelTimes } from '@/hooks/useHotelTimes'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { todayLocalISO } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Reservation, Room } from '@/types'

interface Props {
  readonly reservation: Reservation
  readonly rooms: Room[]
  readonly onClose: () => void
  readonly onSuccess?: () => void
}

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return { dialogRef, backdropClassName }
}

function isAvailableRoom(room: Room): boolean {
  return ['available', 'reserved'].includes(room.status) && room.is_active
}

function sortRoomsReservedFirst(rooms: Room[], reservedRoomId: string | null): Room[] {
  return [...rooms].sort((a, b) => {
    if (a.id === reservedRoomId) return -1
    if (b.id === reservedRoomId) return 1
    return 0
  })
}

function checkInSubmitLabel(checkingIn: boolean): string {
  if (checkingIn) return 'Procesando...'
  return 'Confirmar check-in'
}

function initialPriceForRoom(
  reservedRoomAvailable: boolean,
  reservedRoomId: string | null,
  pricePerNight: number,
): Record<string, string> {
  if (!reservedRoomAvailable || !reservedRoomId) return {}
  if (pricePerNight <= 0) return { [reservedRoomId]: '' }
  return { [reservedRoomId]: String(Math.round(pricePerNight)) }
}

export default function CheckInFromReservationModal({ reservation, rooms, onClose, onSuccess }: Props) {
  // "Hoy" en TZ local del browser (no UTC). Si usáramos toISOString().slice(0,10)
  // después de las 19:00 de Bogotá quedaríamos guardando el check-in con fecha
  // de mañana, dejando la habitación fuera del KPI de ingresos de hoy.
  const today = todayLocalISO()

  const availableRooms = rooms.filter(isAvailableRoom)

  const reservedRoomId = reservation.room_id
  const reservedRoomAvailable = !!reservedRoomId && availableRooms.some((r) => r.id === reservedRoomId)
  const pricePerNight = reservation.nights > 0
    ? Number(reservation.agreed_price ?? 0) / reservation.nights
    : 0

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(
    reservedRoomAvailable && reservedRoomId ? [reservedRoomId] : [],
  )
  const [prices, setPrices] = useState<Record<string, string>>(
    initialPriceForRoom(reservedRoomAvailable, reservedRoomId, pricePerNight),
  )
  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState((reservation.end_date ?? '').slice(0, 10))

  const { checkIn: doCheckIn, isCheckingIn } = useReservations()
  const { checkInTime, checkOutTime } = useHotelTimes()
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  const sortedRooms = sortRoomsReservedFirst(availableRooms, reservedRoomId)

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
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

  const canSubmit = selectedRoomIds.length > 0 && selectedRoomIds.every((id) => Number(prices[id] ?? 0) >= 0)

  let roomListContent
  if (availableRooms.length === 0) {
    roomListContent = (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay habitaciones disponibles.</p>
    )
  } else {
    roomListContent = (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {sortedRooms.map((room) => {
          const selected = selectedRoomIds.includes(room.id)
          const isReserved = room.id === reservedRoomId
          return (
            <div
              key={room.id}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors"
              style={{
                background: 'var(--bg-main)',
                border: selected ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
              }}
            >
              <button
                type="button"
                onClick={() => toggleRoom(room.id)}
                className="flex flex-1 items-center gap-3 text-left min-w-0"
              >
                <BedDouble size={16} style={{ color: selected ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
              </button>
              {selected && (
                <>
                  <label htmlFor={`checkin-price-${room.id}`} className="sr-only">
                    Precio por noche — Hab. {room.number}
                  </label>
                  <input
                    id={`checkin-price-${room.id}`}
                    type="number"
                    min="0"
                    className="w-28 px-2 py-1 rounded text-sm border text-right shrink-0"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    placeholder="Precio/noche"
                    value={prices[room.id] ?? ''}
                    onChange={(e) => setPrices((p) => ({ ...p, [room.id]: e.target.value }))}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Check-in desde reserva"
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Check-in desde reserva</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {reservation.guest?.full_name ?? '—'} · {reservation.nights} noche(s)
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="checkin-from-res-date-in" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Check-in
              </label>
              <input
                id="checkin-from-res-date-in"
                type="date"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="checkin-from-res-date-out" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Check-out
              </label>
              <input
                id="checkin-from-res-date-out"
                type="date"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Seleccionar habitación(es)</p>
            {roomListContent}
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isCheckingIn}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <CheckCircle size={16} />
            {checkInSubmitLabel(isCheckingIn)}
          </button>
        </div>
      </div>
    </dialog>
  )
}
