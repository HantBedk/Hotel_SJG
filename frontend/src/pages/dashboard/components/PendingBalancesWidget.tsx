import { DollarSign } from 'lucide-react'
import type { Stay } from '@/types'
import { formatCOP } from '@/lib/format'
import DashboardSection from './DashboardSection'

export interface PendingBalanceRow {
  stay: Stay
  total: number
  paid: number
  balance: number
}

interface PendingBalancesWidgetProps {
  readonly items: PendingBalanceRow[]
  readonly onSelect: (row: PendingBalanceRow) => void
}

export default function PendingBalancesWidget({ items, onSelect }: PendingBalancesWidgetProps) {
  const total = items.reduce((acc, it) => acc + it.balance, 0)

  return (
    <DashboardSection
      id="dashboard-balances"
      title="Saldos pendientes"
      description="Estadías con saldo por cobrar"
      icon={DollarSign}
      iconColor="#EF4444"
      className="lg:flex-1"
      bodyClassName="!p-3 flex flex-col min-h-0"
      badge={
        items.length > 0 ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {items.length}
          </span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            No hay saldos pendientes en estadías activas
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-64 lg:max-h-none">
            {items.map(({ stay, total: stayTotal, paid, balance }) => {
              const roomsLabel = (stay.stay_rooms ?? [])
                .filter((sr) => sr.is_active !== false)
                .map((sr) => sr.room?.number)
                .filter(Boolean)
                .join(', ')

              return (
                <button
                  key={stay.id}
                  type="button"
                  className="compact-control w-full text-left flex items-start gap-3 p-2.5 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
                  onClick={() => onSelect({ stay, total: stayTotal, paid, balance })}
                >
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      Hab. {roomsLabel || '—'}
                    </span>
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {stay.guest?.full_name ?? '—'}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Total {formatCOP(stayTotal)} · Pagado {formatCOP(paid)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      Saldo
                    </p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: '#EF4444' }}>
                      {formatCOP(balance)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
          <div
            className="flex items-center justify-between pt-3 mt-2 shrink-0 text-xs"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total por cobrar
            </span>
            <span className="font-bold tabular-nums" style={{ color: '#EF4444' }}>
              {formatCOP(total)}
            </span>
          </div>
        </>
      )}
    </DashboardSection>
  )
}
