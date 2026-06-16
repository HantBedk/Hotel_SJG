import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { formatDateShort } from '@/lib/formatDate'
import type { Stay } from '@/types'

interface RequestStayVoidModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly stay: Stay | null
  readonly onConfirm: (reason: string) => Promise<unknown>
  readonly isPending?: boolean
}

export function RequestStayVoidModal({
  open, onClose, stay, onConfirm, isPending,
}: RequestStayVoidModalProps) {
  const [reason, setReason] = useState('')

  if (!stay) return null

  const rooms = stay.stay_rooms
    ?.filter((sr) => sr.is_active !== false)
    .map((sr) => sr.room?.number)
    .filter(Boolean)
    .join(', ')

  const handleConfirm = async () => {
    if (reason.trim().length < 5) return
    await onConfirm(reason.trim())
    setReason('')
    onClose()
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const valid = reason.trim().length >= 5

  return (
    <Modal open={open} onClose={handleClose} title="Solicitar anulación de estadía" size="md">
      <div className="space-y-4 px-4 pb-4">
        <div
          className="rounded-lg p-3 text-xs"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Huésped</span>
            <span style={{ color: 'var(--text-primary)' }}>{stay.guest?.full_name ?? '—'}</span>
          </div>
          {rooms && (
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Habitación</span>
              <span style={{ color: 'var(--text-primary)' }}>Hab. {rooms}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Estadía</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {formatDateShort(stay.check_in_datetime)} → {formatDateShort(stay.check_out_datetime)}
            </span>
          </div>
        </div>

        <div className="rounded-lg p-3 text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
          La habitación quedará <strong>disponible de inmediato</strong>. Un administrador revisará
          la solicitud y podrá aprobarla o rechazarla (solo auditoría; la habitación no se restaura).
        </div>

        <div>
          <label
            htmlFor="void-request-reason"
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Motivo <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            id="void-request-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: check-in en habitación equivocada, huésped duplicado por error..."
            className="w-full px-3 py-2 rounded-lg text-xs border focus:outline-none"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-default)',
            }}
          />
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Mínimo 5 caracteres. {reason.length}/500
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!valid || isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: '#EF4444', color: 'white' }}
          >
            {isPending ? 'Enviando…' : 'Solicitar anulación'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
