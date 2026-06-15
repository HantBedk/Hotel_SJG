import { DollarSign } from 'lucide-react'
import type { Stay } from '@/types'

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
    <div
      className="rounded-xl p-3 flex flex-col flex-1 min-h-0"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <DollarSign size={13} style={{ color: '#EF4444' }} />
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          Saldos pendientes
        </h3>
        {items.length > 0 && (
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Sin saldos pendientes
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {items.map(({ stay, total: t, paid, balance }) => {
              const roomsLabel = (stay.stay_rooms ?? [])
                .filter((sr) => sr.is_active !== false)
                .map((sr) => sr.room?.number)
                .filter(Boolean)
                .join(', ')
              return (
                <button
                  key={stay.id}
                  type="button"
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  onClick={() => onSelect({ stay, total: t, paid, balance })}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                      >
                        Hab. {roomsLabel || '—'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {stay.guest?.full_name ?? '—'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Total ${t.toLocaleString('es-CO')} · Pagado ${paid.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Saldo
                    </p>
                    <p className="text-xs font-bold tabular-nums" style={{ color: '#EF4444' }}>
                      ${balance.toLocaleString('es-CO')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
          <div
            className="flex items-center justify-between pt-2 mt-2 shrink-0 text-[11px]"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total por cobrar
            </span>
            <span className="font-bold tabular-nums" style={{ color: '#EF4444' }}>
              ${total.toLocaleString('es-CO')}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
