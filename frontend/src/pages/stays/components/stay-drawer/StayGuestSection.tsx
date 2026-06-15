import { User } from 'lucide-react'
import type { Stay } from '@/types'
import { DOC_LABELS } from './utils'

interface StayGuestSectionProps {
  readonly guest: NonNullable<Stay['guest']>
}

export function StayGuestSection({ guest }: StayGuestSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <User size={15} style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Huésped</p>
      </div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{guest.full_name}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {DOC_LABELS[guest.document_type] ?? guest.document_type} {guest.document_number}
      </p>
      {guest.phone && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{guest.phone}</p>}
    </section>
  )
}
