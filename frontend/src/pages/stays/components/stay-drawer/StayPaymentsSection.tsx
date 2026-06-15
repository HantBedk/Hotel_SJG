import { useState } from 'react'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import type { Payment, Stay } from '@/types'
import type { PaymentForm } from './types'
import { formatCurrency, PAYMENT_METHOD_LABELS } from './utils'

interface StayPaymentsSectionProps {
  readonly stayId: string
  readonly stay: Stay
  readonly canCancelPayments: boolean
  readonly onAddPayment: (payload: {
    stayId: string
    amount: number
    payment_method: string
    payment_type: string
    paid_by: string
    notes?: string
  }) => void
  readonly onRequestCancel: (payment: Payment) => void
}

const INITIAL_PAY_FORM: PaymentForm = {
  amount: '',
  payment_method: 'cash',
  payment_type: 'partial',
  paid_by: 'guest',
  notes: '',
}

export function StayPaymentsSection({
  stayId, stay, canCancelPayments, onAddPayment, onRequestCancel,
}: StayPaymentsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PaymentForm>(INITIAL_PAY_FORM)

  const handleAdd = () => {
    const amount = Number.parseFloat(form.amount)
    if (!amount || amount <= 0) return
    onAddPayment({
      stayId,
      amount,
      payment_method: form.payment_method,
      payment_type: form.payment_type,
      paid_by: stay.company ? form.paid_by : 'guest',
      notes: form.notes || undefined,
    })
    setShowForm(false)
    setForm(INITIAL_PAY_FORM)
  }

  const payFields = stay.company ? ['payment_method', 'paid_by'] as const : ['payment_method'] as const

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CreditCard size={15} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Pagos</p>
        </div>
        {stay.status === 'active' && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={12} /> Registrar
          </button>
        )}
      </div>

      {stay.payments && stay.payments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {stay.payments.map((p) => {
            const isCancelled = !!p.cancelled_at
            return (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm"
                style={{ opacity: isCancelled ? 0.55 : 1 }}
              >
                <span style={{ color: 'var(--text-secondary)', textDecoration: isCancelled ? 'line-through' : undefined }}>
                  {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                </span>
                <div className="flex items-center gap-2">
                  {isCancelled && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: '#FEE2E2', color: '#991B1B' }}
                      title={p.cancellation_reason ?? undefined}
                    >
                      ANULADO
                    </span>
                  )}
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text-primary)', textDecoration: isCancelled ? 'line-through' : undefined }}
                  >
                    {formatCurrency(p.amount)}
                  </span>
                  {!isCancelled && canCancelPayments && stay.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => onRequestCancel(p)}
                      title="Anular pago"
                      className="p-0.5 rounded hover:bg-red-50"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
        >
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Nuevo pago</p>
          <input
            type="number"
            placeholder="Monto"
            value={form.amount}
            onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
          <div className={stay.company ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
            {payFields.map((field) => (
              <select
                key={field}
                value={form[field]}
                onChange={(e) => setForm((s) => ({ ...s, [field]: e.target.value }))}
                className="px-2 py-2 rounded-lg text-xs border outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {field === 'payment_method' && (
                  <>
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                    <option value="credito">Crédito</option>
                  </>
                )}
                {field === 'paid_by' && (
                  <>
                    <option value="guest">Huésped</option>
                    <option value="company">Empresa</option>
                    <option value="mixed">Mixto</option>
                  </>
                )}
              </select>
            ))}
          </div>
          <input
            type="text"
            placeholder="Observaciones (opcional)"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.amount}
              className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Guardar
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
