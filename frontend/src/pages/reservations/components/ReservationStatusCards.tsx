import { Archive, BedDouble, CalendarCheck, LayoutGrid } from 'lucide-react'
import KpiCard from '@/pages/dashboard/components/KpiCard'
import type { Reservation } from '@/types'
import {
  type ReservationGroupKey,
  countReservationsByGroup,
  filterReservationsByGroup,
} from '../reservationPageUtils'

const GROUP_CARDS: {
  key: ReservationGroupKey | ''
  label: string
  sub: string
  color: string
  colorBg: string
  icon: typeof LayoutGrid
}[] = [
  {
    key: '',
    label: 'Todas',
    sub: 'Vista agrupada',
    color: 'var(--color-primary)',
    colorBg: 'var(--color-primary-light)',
    icon: LayoutGrid,
  },
  {
    key: 'active',
    label: 'Activas',
    sub: 'Pendientes y confirmadas',
    color: '#F59E0B',
    colorBg: '#F59E0B22',
    icon: CalendarCheck,
  },
  {
    key: 'in_stay',
    label: 'En estadía',
    sub: 'Check-in realizado',
    color: '#22C55E',
    colorBg: '#22C55E22',
    icon: BedDouble,
  },
  {
    key: 'closed',
    label: 'Cerradas',
    sub: 'Canceladas y no show',
    color: '#94A3B8',
    colorBg: '#94A3B822',
    icon: Archive,
  },
]

interface ReservationStatusCardsProps {
  readonly reservations: Reservation[]
  readonly selected: ReservationGroupKey | ''
  readonly onSelect: (group: ReservationGroupKey | '') => void
}

function countForGroup(reservations: Reservation[], key: ReservationGroupKey | ''): number {
  if (!key) return reservations.length
  return countReservationsByGroup(reservations, key)
}

export default function ReservationStatusCards({
  reservations,
  selected,
  onSelect,
}: ReservationStatusCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {GROUP_CARDS.map((card) => {
        const count = countForGroup(reservations, card.key)

        return (
          <KpiCard
            key={card.key || 'all'}
            label={card.label}
            value={count}
            sub={card.sub}
            icon={card.icon}
            color={card.color}
            colorBg={card.colorBg}
            selected={selected === card.key}
            onClick={() => onSelect(card.key)}
          />
        )
      })}
    </div>
  )
}

export const LIST_GROUPS: {
  key: ReservationGroupKey
  label: string
}[] = [
  { key: 'active', label: 'Activas' },
  { key: 'in_stay', label: 'En estadía' },
  { key: 'closed', label: 'Cerradas' },
]

export function reservationsForListView(
  reservations: Reservation[],
  groupFilter: ReservationGroupKey | '',
): { key: ReservationGroupKey; label: string; items: Reservation[] }[] {
  if (groupFilter) {
    const match = LIST_GROUPS.find((g) => g.key === groupFilter)
    return [{
      key: groupFilter,
      label: match?.label ?? '',
      items: filterReservationsByGroup(reservations, groupFilter),
    }]
  }

  return LIST_GROUPS
    .map((group) => ({
      ...group,
      items: filterReservationsByGroup(reservations, group.key),
    }))
    .filter((group) => group.items.length > 0)
}
