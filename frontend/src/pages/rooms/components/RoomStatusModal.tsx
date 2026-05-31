import { useState } from 'react'
import { X } from 'lucide-react'
import type { Room, RoomStatus } from '@/types'
import { STATUS_CONFIG } from './RoomStatusBadge'
import { cn } from '@/lib/cn'

const STATUSES = Object.keys(STATUS_CONFIG) as RoomStatus[]

interface Props {
  room: Room
  onConfirm: (status: RoomStatus, notes?: string) => void
  onClose: () => void
  isSaving: boolean
}

export function RoomStatusModal({ room, onConfirm, onClose, isSaving }: Props) {
  const [selected, setSelected] = useState<RoomStatus>(room.status)
  const [notes, setNotes]       = useState(room.notes ?? '')

  const changed = selected !== room.status

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Cambiar estado de habitación"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Hab. {room.number}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {room.room_type.name}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="icon-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status selector */}
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s]
            const isActive = selected === s
            return (
              <button
                key={s}
                onClick={() => setSelected(s)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all text-left',
                  isActive ? 'border-2' : 'hover:opacity-80'
                )}
                style={{
                  borderColor:  isActive ? cfg.color : 'var(--border-default)',
                  background:   isActive ? cfg.bg : 'transparent',
                  color:        isActive ? cfg.color : 'var(--text-secondary)',
                  fontWeight:   isActive ? 600 : 400,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: cfg.color }}
                />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ej: Cliente solicita llegada tarde"
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm border transition-colors"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selected, notes || undefined)}
            disabled={!changed || isSaving}
            aria-busy={isSaving}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            {isSaving ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
