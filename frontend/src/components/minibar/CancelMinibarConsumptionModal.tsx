import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { formatCOP } from '@/lib/format'
import type { MinibarConsumption } from '@/types'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly consumption: MinibarConsumption | null
  readonly onConfirm: (reason: string) => Promise<unknown>
  readonly isPending?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  consumed: 'Consumido',
  damaged:  'Dañado',
  missing:  'Faltante',
}

export function CancelMinibarConsumptionModal({ open, onClose, consumption, onConfirm, isPending }: Props) {
  const [reason, setReason] = useState('')

  if (!consumption) return null

  const total = typeof consumption.total === 'string' ? Number.parseFloat(consumption.total) : consumption.total

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
    <Modal open={open} onClose={handleClose} title="Anular consumo de minibar" size="md">
      <div className="space-y-4 px-4 pb-4">
        <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Producto</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {consumption.product_name} × {consumption.quantity}
            </span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Tipo</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {TYPE_LABELS[consumption.type] ?? consumption.type}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Total</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCOP(total)}</span>
          </div>
        </div>

        <div className="rounded-lg p-3 text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
          El consumo se eliminará del cargo de la estadía. La acción queda registrada en el historial de movimientos y se notifica a los administradores.
        </div>

        <div>
          <label
            htmlFor="cancel-minibar-reason"
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Motivo de la anulación <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            id="cancel-minibar-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: producto cargado por error, cantidad incorrecta..."
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
            {isPending ? 'Anulando…' : 'Anular consumo'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
