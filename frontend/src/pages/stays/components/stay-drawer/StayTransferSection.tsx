import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { StayRoom } from '@/types'
import { useRooms } from '@/hooks/useRooms'
import type { TransferForm } from './types'

interface StayTransferSectionProps {
  readonly stayId: string
  readonly activeRooms: readonly StayRoom[]
  readonly onTransfer: (payload: { stayId: string; from_room_id: string; to_room_id: string; reason?: string }) => void
}

export function StayTransferSection({ stayId, activeRooms, onTransfer }: StayTransferSectionProps) {
  const { rooms: availableRooms } = useRooms('available')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TransferForm>({
    from_room_id: activeRooms[0]?.room_id ?? '',
    to_room_id: '',
    reason: '',
  })

  const handleTransfer = () => {
    if (!form.from_room_id || !form.to_room_id) return
    onTransfer({
      stayId,
      from_room_id: form.from_room_id,
      to_room_id: form.to_room_id,
      reason: form.reason || undefined,
    })
    setShowForm(false)
  }

  if (activeRooms.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={15} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Transferencia</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs px-2 py-1 rounded-lg border hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Transferir hab.
          </button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Desde</p>
              <select
                value={form.from_room_id}
                onChange={(e) => setForm((s) => ({ ...s, from_room_id: e.target.value }))}
                className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {activeRooms.map((sr) => (
                  <option key={sr.room_id} value={sr.room_id}>Hab. {sr.room?.number}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Hacia</p>
              <select
                value={form.to_room_id}
                onChange={(e) => setForm((s) => ({ ...s, to_room_id: e.target.value }))}
                className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option value="">Seleccionar...</option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>Hab. {r.number}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="text"
            placeholder="Motivo (opcional)"
            value={form.reason}
            onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTransfer}
              disabled={!form.to_room_id}
              className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
