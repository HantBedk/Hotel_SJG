import { Users } from 'lucide-react'
import { OCCUPANCY_KEYS } from '@/pages/checkin/constants'
import { formAdjective, formWord, guestWord } from '@/pages/checkin/wizardLogic'
import { OccupancyCounter } from '@/pages/checkin/components/WizardFieldComponents'

interface OccupancyStepProps {
  readonly adults: number
  readonly childCount: number
  readonly onDecrement: (key: typeof OCCUPANCY_KEYS[number]) => void
  readonly onIncrement: (key: typeof OCCUPANCY_KEYS[number]) => void
}

export function OccupancyStep({ adults, childCount, onDecrement, onIncrement }: OccupancyStepProps) {
  const totalGuests = adults + childCount
  const extraForms = totalGuests - 1

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        PASO 1 — OCUPACIÓN DE LA HABITACIÓN
      </p>

      {OCCUPANCY_KEYS.map((key) => (
        <OccupancyCounter
          key={key}
          label={key === 'adults' ? 'Adultos' : 'Niños'}
          hint={key === 'adults' ? '13 años o más' : 'Menores de 13 años'}
          value={key === 'adults' ? adults : childCount}
          min={key === 'adults' ? 1 : 0}
          onDecrement={() => onDecrement(key)}
          onIncrement={() => onIncrement(key)}
        />
      ))}

      <div className="p-3 rounded-lg text-sm space-y-0.5" style={{ background: 'var(--bg-input)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Users size={14} />
          <span>
            Total:{' '}
            <strong>{totalGuests}</strong>{' '}
            {guestWord(totalGuests)}
          </span>
        </div>
        {totalGuests > 1 && (
          <p className="text-xs pl-5" style={{ color: 'var(--text-muted)' }}>
            El titular se registra en el paso siguiente. Se generarán{' '}
            <strong>{extraForms}</strong> {formWord(extraForms)} {formAdjective(extraForms)}.
          </p>
        )}
      </div>
    </div>
  )
}
