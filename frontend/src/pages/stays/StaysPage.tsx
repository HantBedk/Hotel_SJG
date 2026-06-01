import { useState, useEffect } from 'react'
import { useStays } from '@/hooks/useStays'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { StayDrawer } from './components/StayDrawer'
import { CheckoutWizard } from './components/CheckoutWizard'
import type { Stay } from '@/types'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Activa',    color: 'var(--status-occupied)',  bg: '#FFF1F2' },
  extended:    { label: 'Extendida', color: 'var(--status-reserved)',  bg: '#FFFBEB' },
  checked_out: { label: 'Cerrada',   color: 'var(--text-muted)',       bg: 'var(--bg-input)' },
}

const FILTERS = [
  { key: 'active',      label: 'Activas' },
  { key: 'checked_out', label: 'Cerradas' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

function formatCurrency(amount: string | number | null) {
  if (amount == null) return '—'
  return `$${Number(amount).toLocaleString('es-CO')}`
}

export default function StaysPage() {
  const { hasPermission } = useAuth()
  const canCheckOut = hasPermission('check_out')

  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [selected, setSelected] = useState<Stay | null>(null)
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null)

  const { stays, isLoading, transfer, addPayment, addService, extend } = useStays(statusFilter)

  useEffect(() => {
    if (selected) {
      const updated = (stays as Stay[]).find((s) => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stays])

  const handleCheckoutSuccess = () => {
    setCheckoutStay(null)
    setSelected(null)
  }

  return (
    <div className="space-y-5">

      {/* Filter */}
      <div className="flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className="px-4 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              background:  statusFilter === key ? 'var(--color-primary)' : 'transparent',
              color:       statusFilter === key ? '#fff' : 'var(--text-secondary)',
              borderColor: statusFilter === key ? 'transparent' : 'var(--border-default)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (stays as Stay[]).length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay estadías {statusFilter === 'active' ? 'activas' : 'cerradas'}.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Huésped', 'Habitaciones', 'Entrada', 'Salida prevista', 'Total', 'Pagado', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stays as Stay[]).map((stay) => {
                const cfg = STATUS_LABELS[stay.status] ?? STATUS_LABELS.active
                return (
                  <tr
                    key={stay.id}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ borderBottom: '1px solid var(--border-default)' }}
                    onClick={() => setSelected(stay)}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {stay.guest?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {stay.stay_rooms?.filter((sr) => sr.is_active).map((sr) => sr.room?.number).join(', ') ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(stay.check_in_datetime)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(stay.check_out_datetime)}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(stay.total_amount)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(stay.paid_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {stay.status === 'active' && canCheckOut && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCheckoutStay(stay)
                          }}
                          className="px-3 py-1 rounded-lg text-xs border hover:opacity-80"
                          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                        >
                          Checkout
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Stay detail drawer */}
      {selected && (
        <StayDrawer
          stayId={selected.id}
          initialStay={selected}
          onClose={() => setSelected(null)}
          canCheckOut={canCheckOut}
          onCheckOut={(id: string) => {
            const stay = (stays as Stay[]).find((s) => s.id === id)
            if (stay) setCheckoutStay(stay)
          }}
          onAddPayment={addPayment}
          onAddService={addService}
          onTransfer={transfer}
          onExtend={extend}
        />
      )}

      {/* Checkout wizard */}
      {checkoutStay && (
        <CheckoutWizard
          stay={checkoutStay}
          onClose={() => setCheckoutStay(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  )
}
