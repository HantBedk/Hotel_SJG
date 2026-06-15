import { BedDouble } from 'lucide-react'
import type { StayRoom } from '@/types'
import { formatCurrency } from './utils'

interface StayRoomsSectionProps {
  readonly stayRooms: readonly StayRoom[]
}

export function StayRoomsSection({ stayRooms }: StayRoomsSectionProps) {
  const active = stayRooms.filter((sr) => sr.is_active)
  if (active.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <BedDouble size={15} style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Habitaciones</p>
      </div>
      <div className="space-y-2">
        {active.map((sr) => (
          <div key={sr.id} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              Hab. {sr.room?.number} — {sr.room?.room_type?.name}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(sr.price_per_night)}/noche
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
