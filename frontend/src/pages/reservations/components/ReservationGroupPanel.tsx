import { ReservationCard } from './ReservationCard'
import type { Reservation } from '@/types'

interface ReservationGroupPanelProps {
  readonly label: string
  readonly count: number
  readonly items: Reservation[]
  readonly onSelect: (reservation: Reservation) => void
  readonly onCheckIn: (reservation: Reservation) => void
  readonly onCancel: (reservation: Reservation) => void
}

export default function ReservationGroupPanel({
  label,
  count,
  items,
  onSelect,
  onCheckIn,
  onCancel,
}: ReservationGroupPanelProps) {
  return (
    <section
      className="rounded-xl flex flex-col min-h-0 overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <header
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </h3>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          {count}
        </span>
      </header>
      <div className="overflow-y-auto min-h-0 px-2 py-1">
        {items.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onSelect={() => onSelect(reservation)}
            onCheckIn={() => onCheckIn(reservation)}
            onCancel={() => onCancel(reservation)}
          />
        ))}
      </div>
    </section>
  )
}
