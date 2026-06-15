import type { Stay } from '@/types'
import { activeRoomNumbers, formatCurrency, formatDate, stayStatusConfig } from './utils'

interface StayTableRowProps {
  readonly stay: Stay
  readonly canCheckOut: boolean
  readonly onSelect: (stay: Stay) => void
  readonly onCheckout: (stay: Stay) => void
}

function guestDetailLabel(stay: Stay): string {
  const name = stay.guest?.full_name ?? 'huésped'
  return `Ver estadía de ${name}`
}

export function StayTableRow({ stay, canCheckOut, onSelect, onCheckout }: StayTableRowProps) {
  const cfg = stayStatusConfig(stay.status)
  const guestName = stay.guest?.full_name ?? '—'

  return (
    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
      <td colSpan={7} className="p-0">
        <button
          type="button"
          onClick={() => onSelect(stay)}
          aria-label={guestDetailLabel(stay)}
          className="grid w-full text-sm text-left cursor-pointer hover:opacity-90 transition-opacity"
          style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
        >
          <span className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
            {guestName}
          </span>
          <span className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
            {activeRoomNumbers(stay)}
          </span>
          <span className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
            {formatDate(stay.check_in_datetime)}
          </span>
          <span className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
            {formatDate(stay.check_out_datetime)}
          </span>
          <span className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(stay.total_amount)}
          </span>
          <span className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
            {formatCurrency(stay.paid_amount)}
          </span>
          <span className="px-4 py-3">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        {stay.status === 'active' && canCheckOut && (
          <button
            type="button"
            onClick={() => onCheckout(stay)}
            aria-label={`Iniciar checkout de ${guestName}`}
            className="px-3 py-1 rounded-lg text-xs border hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Checkout
          </button>
        )}
      </td>
    </tr>
  )
}
