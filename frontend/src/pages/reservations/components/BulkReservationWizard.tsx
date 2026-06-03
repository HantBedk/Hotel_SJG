import { useState, useMemo } from 'react'
import { X, Search, User, Users as UsersIcon, CheckCircle } from 'lucide-react'
import { useGuestSearch } from '@/hooks/useGuests'
import { useRooms } from '@/hooks/useRooms'
import { useReservations } from '@/hooks/useReservations'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { Guest, Room } from '@/types'

interface Props {
  onClose: () => void
  onSuccess?: () => void
}

function addDays(date: string, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function BulkReservationWizard({ onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose)

  const [guest, setGuest] = useState<Guest | null>(null)
  const [guestSearch, setGuestSearch] = useState('')
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(addDays(today, 1))
  const [billingMode, setBillingMode] = useState<'single' | 'individual'>('single')
  const [notes, setNotes] = useState('')

  const { data: guestResults = [] } = useGuestSearch(guestSearch)
  const { rooms } = useRooms()
  const availableRooms = (rooms as Room[]).filter((r) => r.status === 'available' || r.status === 'reserved')

  const { createBulk, isCreatingBulk } = useReservations()

  const nights = useMemo(() => {
    const d1 = new Date(startDate)
    const d2 = new Date(endDate)
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000))
  }, [startDate, endDate])

  const total = useMemo(() => {
    return selectedRoomIds.reduce((sum, id) => sum + (Number(prices[id]) || 0) * nights, 0)
  }, [selectedRoomIds, prices, nights])

  const toggleRoom = (room: Room) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(room.id)) {
        const next = prev.filter((id) => id !== room.id)
        setPrices((p) => { const c = { ...p }; delete c[room.id]; return c })
        return next
      }
      setPrices((p) => ({ ...p, [room.id]: String(room.room_type?.base_price ?? '') }))
      return [...prev, room.id]
    })
  }

  const canSubmit = guest && selectedRoomIds.length >= 2 && nights > 0 &&
    selectedRoomIds.every((id) => Number(prices[id]) > 0)

  const handleSubmit = async () => {
    if (!canSubmit || !guest) return
    const numericPrices: Record<string, number> = {}
    for (const id of selectedRoomIds) numericPrices[id] = Number(prices[id])
    await createBulk({
      guest_id:     guest.id,
      room_ids:     selectedRoomIds,
      start_date:   startDate,
      end_date:     endDate,
      prices:       numericPrices,
      billing_mode: billingMode,
      notes:        notes || undefined,
    })
    onSuccess?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nueva reserva grupal"
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <UsersIcon size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Reserva grupal</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Guest */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Huésped principal
            </label>
            {guest ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <User size={14} />
                  {guest.full_name} · {guest.document_number}
                </span>
                <button onClick={() => setGuest(null)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  placeholder="Buscar huésped por nombre o documento…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
                  style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                />
                {guestSearch.length >= 2 && guestResults.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                    {guestResults.slice(0, 5).map((g) => (
                      <li key={g.id}>
                        <button
                          onClick={() => { setGuest(g); setGuestSearch('') }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {g.full_name} · {g.document_number}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Dates */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Fechas
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" min={today} value={startDate} onChange={(e) => {
                setStartDate(e.target.value)
                if (e.target.value >= endDate) setEndDate(addDays(e.target.value, 1))
              }} className="px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
              <input type="date" min={addDays(startDate, 1)} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
            </div>
            {nights > 0 && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-primary)' }}>{nights} noche{nights !== 1 ? 's' : ''}</p>
            )}
          </section>

          {/* Rooms */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Habitaciones ({selectedRoomIds.length} seleccionadas — mínimo 2)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {availableRooms.map((room) => {
                const selected = selectedRoomIds.includes(room.id)
                return (
                  <button
                    key={room.id}
                    onClick={() => toggleRoom(room)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left"
                    style={{
                      background: selected ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--bg-input)',
                      borderColor: selected ? 'var(--color-primary)' : 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selected ? <CheckCircle size={14} style={{ color: 'var(--color-primary)' }} /> : <span className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: 'var(--border-default)' }} />}
                    <span>Hab. {room.number}</span>
                    {room.room_type?.name && <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{room.room_type.name}</span>}
                  </button>
                )
              })}
            </div>

            {selectedRoomIds.length > 0 && (
              <div className="mt-3 rounded-lg border divide-y" style={{ borderColor: 'var(--border-default)' }}>
                {selectedRoomIds.map((id) => {
                  const room = availableRooms.find((r) => r.id === id)
                  if (!room) return null
                  return (
                    <div key={id} className="flex items-center gap-3 px-3 py-2">
                      <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                        Hab. {room.number}
                      </span>
                      <input
                        type="number"
                        min={0}
                        placeholder="Precio/noche"
                        className="w-28 px-2 py-1 rounded text-sm border text-right"
                        style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        value={prices[id] ?? ''}
                        onChange={(e) => setPrices((p) => ({ ...p, [id]: e.target.value }))}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Billing mode */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Modo de facturación
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['single', 'individual'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBillingMode(mode)}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{
                    background: billingMode === mode ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--bg-input)',
                    borderColor: billingMode === mode ? 'var(--color-primary)' : 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {mode === 'single' ? 'Factura única (empresa/grupo)' : 'Factura individual'}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Notas (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </section>

          {total > 0 && (
            <p className="text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total estimado: ${total.toLocaleString('es-CO')}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button
            disabled={!canSubmit || isCreatingBulk}
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}
          >
            {isCreatingBulk ? 'Creando…' : `Crear ${selectedRoomIds.length} reservas`}
          </button>
        </div>
      </div>
    </div>
  )
}
