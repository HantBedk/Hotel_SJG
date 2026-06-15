import { Building2 } from 'lucide-react'
import type { Stay } from '@/types'

interface StayCompanySectionProps {
  readonly company: NonNullable<Stay['company']>
}

export function StayCompanySection({ company }: StayCompanySectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={15} style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Empresa</p>
      </div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{company.name}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>NIT {company.nit}</p>
    </section>
  )
}
