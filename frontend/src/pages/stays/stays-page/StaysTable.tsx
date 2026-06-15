import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Stay } from '@/types'
import { StayTableRow } from './StayTableRow'
import { emptyStaysLabel, STAY_SKELETON_KEYS, STAY_TABLE_HEADERS } from './utils'

interface StaysTableProps {
  readonly stays: readonly Stay[]
  readonly isLoading: boolean
  readonly statusFilter: string
  readonly canCheckOut: boolean
  readonly onSelect: (stay: Stay) => void
  readonly onCheckout: (stay: Stay) => void
}

export function StaysTable({
  stays, isLoading, statusFilter, canCheckOut, onSelect, onCheckout,
}: StaysTableProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {STAY_SKELETON_KEYS.map((key) => <SkeletonCard key={key} />)}
      </div>
    )
  }

  if (stays.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay estadías {emptyStaysLabel(statusFilter)}.
        </p>
      </div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
          {STAY_TABLE_HEADERS.map((h) => (
            <th
              key={h || 'actions'}
              className="px-4 py-3 text-left text-xs font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stays.map((stay) => (
          <StayTableRow
            key={stay.id}
            stay={stay}
            canCheckOut={canCheckOut}
            onSelect={onSelect}
            onCheckout={onCheckout}
          />
        ))}
      </tbody>
    </table>
  )
}
