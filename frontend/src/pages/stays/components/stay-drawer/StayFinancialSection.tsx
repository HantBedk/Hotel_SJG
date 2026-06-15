import { formatCurrency, pendingBalanceColor } from './utils'

interface StayFinancialSectionProps {
  readonly totalAmount: string | number | null | undefined
  readonly paidAmount: string | number | null | undefined
  readonly pendingBalance: number
}

export function StayFinancialSection({ totalAmount, paidAmount, pendingBalance }: StayFinancialSectionProps) {
  return (
    <section className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-input)' }}>
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--text-muted)' }}>Total</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalAmount)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--text-muted)' }}>Pagado</span>
        <span style={{ color: 'var(--status-available)' }}>{formatCurrency(paidAmount)}</span>
      </div>
      <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Saldo pendiente</span>
        <span style={{ color: pendingBalanceColor(pendingBalance) }}>
          {formatCurrency(pendingBalance)}
        </span>
      </div>
    </section>
  )
}
