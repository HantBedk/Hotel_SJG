interface StayNotesSectionProps {
  readonly notes: string
}

export function StayNotesSection({ notes }: StayNotesSectionProps) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Observaciones</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{notes}</p>
    </section>
  )
}
