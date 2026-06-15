import { formatDate } from './utils'

interface StayDatesSectionProps {
  readonly checkIn: string
  readonly checkOut: string
  readonly nights: number
}

export function StayDatesSection({ checkIn, checkOut, nights }: StayDatesSectionProps) {
  return (
    <section className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span style={{ color: 'var(--text-muted)' }}>Entrada</span>
        <span style={{ color: 'var(--text-primary)' }}>{formatDate(checkIn)}</span>
      </div>
      <div className="flex justify-between">
        <span style={{ color: 'var(--text-muted)' }}>Salida prevista</span>
        <span style={{ color: 'var(--text-primary)' }}>{formatDate(checkOut)}</span>
      </div>
      <div className="flex justify-between">
        <span style={{ color: 'var(--text-muted)' }}>Noches transcurridas</span>
        <span style={{ color: 'var(--text-primary)' }}>{nights}</span>
      </div>
    </section>
  )
}
