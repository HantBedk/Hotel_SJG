import { LogIn, X } from 'lucide-react'
import type { Reservation } from '@/types'
import { formatDateRange } from '@/lib/formatDate'
import {
  PAYMENT_CONFIG,
  STATUS_CONFIG,
  formatCurrency,
  isActiveReservation,
  nightLabel,
  reservationGuestLabel,
  reservationRoomLabel,
} from '../reservationPageUtils'

interface ReservationStatusBadgeProps {
  readonly status: Reservation['status']
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={{ color: cfg.color, background: `${cfg.color}22` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

interface ReservationCardProps {
  readonly reservation: Reservation
  readonly onSelect: () => void
  readonly onCheckIn: () => void
  readonly onCancel: () => void
}

function buildReservationSubtitle(res: Reservation): string {
  const parts = [
    formatDateRange(res.start_date, res.end_date),
    nightLabel(res.nights),
    reservationRoomLabel(res),
    formatCurrency(res.agreed_price),
  ].filter(Boolean)

  return parts.join(' · ')
}

export function ReservationCard({ reservation: res, onSelect, onCheckIn, onCancel }: ReservationCardProps) {
  const canAct = isActiveReservation(res.status)
  const guestName = reservationGuestLabel(res)
  const subtitle = buildReservationSubtitle(res)
  const paymentLabel = PAYMENT_CONFIG[res.payment_status]?.label

  return (
    <div
      className="flex items-center gap-2 py-2 px-1 border-b last:border-0"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 text-left rounded-md px-1 py-0.5 transition-opacity hover:opacity-80"
        title="Ver detalle de la reserva"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {guestName}
          </p>
          <ReservationStatusBadge status={res.status} />
        </div>
        <p className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
        {(res.guest?.document_number || paymentLabel) && (
          <p className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {[
              res.guest?.document_number
                ? `${res.guest.document_type?.toUpperCase() ?? 'DOC'} ${res.guest.document_number}`
                : null,
              paymentLabel,
              res.company ? 'Empresa' : null,
            ].filter(Boolean).join(' · ')}
          </p>
        )}
      </button>

      {canAct && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onCheckIn}
            className="p-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
            title="Check-in"
            aria-label="Check-in"
          >
            <LogIn size={14} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
            title="Cancelar reserva"
            aria-label="Cancelar reserva"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
