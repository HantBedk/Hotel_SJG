import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { formatCOP } from '@/lib/format'

interface CancelPaymentModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly payment: {
    readonly id: string
    readonly amount: number | string
    readonly guest_name?: string | null
    readonly payment_method?: string
    readonly payment_date?: string
  } | null
  readonly onConfirm: (reason: string) => Promise<unknown>
  readonly isPending?: boolean
}

const METHOD_LABELS: Record<string, string> = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  card:     'Tarjeta',
  credito:  'Crédito',
}

export function CancelPaymentModal({ open, onClose, payment, onConfirm, isPending }: CancelPaymentModalProps) {
  const [reason, setReason] = useState('')

  if (!payment) return null

  const amount = typeof payment.amount === 'string' ? Number.parseFloat(payment.amount) : payment.amount

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
    <Modal open={open} onClose={handleClose} title="Anular pago" size="md">
      <div className="space-y-4 px-4 pb-4">
        <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Monto</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCOP(amount)}</span>
          </div>
          {payment.guest_name && (
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Huésped</span>
              <span style={{ color: 'var(--text-primary)' }}>{payment.guest_name}</span>
            </div>
          )}
          {payment.payment_method && (
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Método</span>
              <span style={{ color: 'var(--text-primary)' }}>{METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</span>
            </div>
          )}
          {payment.payment_date && (
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Fecha</span>
              <span style={{ color: 'var(--text-primary)' }}>{new Date(payment.payment_date).toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg p-3 text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
          El pago no se borra: queda registrado en el historial como ANULADO y se notifica a los administradores.
        </div>

        <div>
          <label
            htmlFor="cancel-payment-reason"
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Motivo de la anulación <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            id="cancel-payment-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: monto digitado mal, pago duplicado por error..."
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
            {isPending ? 'Anulando…' : 'Anular pago'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
