import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { usePaymentsHistory } from '@/hooks/useActivity'
import { useStays } from '@/hooks/useStays'
import { useAuth } from '@/hooks/useAuth'
import type { PaymentFilters } from '@/services/activity.service'
import type { PaymentHistoryEntry } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { CancelPaymentModal } from '@/components/payments/CancelPaymentModal'
import { formatCOP } from '@/lib/format'

const METHOD_LABELS: Record<string, string> = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  card:     'Tarjeta',
}

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Depósito',
  partial: 'Parcial',
  final:   'Final',
}

const PAID_BY_LABELS: Record<string, string> = {
  guest:   'Huésped',
  company: 'Empresa',
  mixed:   'Mixto',
}

export default function PagosHistoricoTab() {
  const [filters, setFilters] = useState<PaymentFilters>({ page: 1 })
  const { data, isLoading }   = usePaymentsHistory(filters)
  const { cancelPayment, isCancellingPayment } = useStays()
  const { hasPermission }     = useAuth()

  const [target, setTarget] = useState<PaymentHistoryEntry | null>(null)

  const payments = data?.data ?? []
  const total    = data?.total ?? 0
  const pages    = data?.last_page ?? 1
  const page     = data?.current_page ?? 1

  const setF = (key: keyof PaymentFilters, value: string) =>
    setFilters(f => ({ ...f, [key]: value || undefined, page: 1 }))

  // Total excluye pagos anulados — coherente con cómo el backend calcula ingresos.
  const totalAmount = payments
    .filter(p => !p.cancelled_at)
    .reduce((acc, p) => acc + parseFloat(p.amount), 0)

  const cancelledCount = payments.filter(p => p.cancelled_at).length

  const canCancel = hasPermission('check_in') || hasPermission('check_out') || hasPermission('manage_reservations')

  const onConfirmCancel = async (reason: string) => {
    if (!target) return
    await cancelPayment({ stayId: target.stay_id, paymentId: target.id, reason })
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={e => setF('date_from', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        />
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={e => setF('date_to', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        />
        <select
          value={filters.method ?? ''}
          onChange={e => setF('method', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <option value="">Todos los métodos</option>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
        </select>
        <select
          value={filters.status ?? ''}
          onChange={e => setF('status', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Solo activos</option>
          <option value="cancelled">Solo anulados</option>
        </select>
        <input
          type="text"
          placeholder="Buscar huésped…"
          value={filters.guest ?? ''}
          onChange={e => setF('guest', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        />
        <div className="ml-auto flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{total} pagos {cancelledCount > 0 && `(${cancelledCount} anulado${cancelledCount === 1 ? '' : 's'})`}</span>
          {payments.length > 0 && (
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Total activo: {formatCOP(totalAmount)}
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        {isLoading ? (
          <div className="p-4"><SkeletonText lines={5} /></div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-default)' }}>
                {['Fecha', 'Huésped', 'Monto', 'Método', 'Tipo', 'Pagó', 'Recepcionista', 'Notas', 'Estado', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                    No hay pagos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const isCancelled = !!p.cancelled_at
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        opacity: isCancelled ? 0.55 : 1,
                      }}
                    >
                      <td className="py-2 px-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.payment_date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-primary)', textDecoration: isCancelled ? 'line-through' : undefined }}>
                        {p.guest_name}
                      </td>
                      <td className="py-2 px-2 font-medium" style={{ color: 'var(--text-primary)', textDecoration: isCancelled ? 'line-through' : undefined }}>
                        {formatCOP(parseFloat(p.amount))}
                      </td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                        {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                      </td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                        {TYPE_LABELS[p.payment_type] ?? p.payment_type}
                      </td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                        {PAID_BY_LABELS[p.paid_by] ?? p.paid_by}
                      </td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{p.receptionist}</td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-muted)' }}>{p.notes ?? '—'}</td>
                      <td className="py-2 px-2">
                        {isCancelled ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[10px] font-bold w-fit"
                              style={{ background: '#FEE2E2', color: '#991B1B' }}
                              title={p.cancellation_reason ?? undefined}
                            >
                              ANULADO
                            </span>
                            {p.cancelled_by && (
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                por {p.cancelled_by}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px]" style={{ color: '#16A34A' }}>Activo</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {!isCancelled && canCancel && (
                          <button
                            onClick={() => setTarget(p)}
                            title="Anular pago"
                            className="p-1 rounded hover:bg-red-50"
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            disabled={page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            ← Anterior
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pág. {page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Siguiente →
          </button>
        </div>
      )}

      <CancelPaymentModal
        open={!!target}
        onClose={() => setTarget(null)}
        payment={target && {
          id: target.id,
          amount: target.amount,
          guest_name: target.guest_name,
          payment_method: target.payment_method,
          payment_date: target.payment_date,
        }}
        onConfirm={onConfirmCancel}
        isPending={isCancellingPayment}
      />
    </div>
  )
}
