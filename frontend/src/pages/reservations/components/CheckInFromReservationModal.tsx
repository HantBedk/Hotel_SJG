import { useState } from 'react'
import { X, BedDouble, CheckCircle } from 'lucide-react'
import { useReservations } from '@/hooks/useReservations'
import type { Reservation, Room } from '@/types'

interface Props {
  reservation: Reservation
  rooms: Room[]
  onClose: () => void
  onSuccess?: () => void
}

export default function CheckInFromReservationModal({ reservation, rooms, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const availableRooms = rooms.filter(r => ['available', 'reserved'].includes(r.status) && r.is_active)

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [prices, setPrices]                   = useState<Record<string, string>>({})
  const [checkIn, setCheckIn]                 = useState(today)
  const [checkOut, setCheckOut]               = useState(reservation.end_date)

  const { checkIn: doCheckIn, isCheckingIn } = useReservations()

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
      check_in_datetime:  `${checkIn}T12:00:00`,
      check_out_datetime: `${checkOut}T12:00:00`,
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
                {availableRooms.map(room => {
                  const selected = selectedRoomIds.includes(room.id)
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
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Hab. {room.number}
                          {room.house && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>· {room.house.name}</span>}
                        </p>
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
