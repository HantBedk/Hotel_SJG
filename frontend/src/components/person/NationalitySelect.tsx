import { useNationalities } from '@/hooks/useNationalities'
import { cn } from '@/lib/cn'
import { personInputClass, personInputStyle } from './personFormStyles'

interface NationalitySelectProps {
  readonly id?: string
  readonly value: string
  readonly onChange: (nationalityId: string) => void
  readonly className?: string
  readonly disabled?: boolean
  readonly allowEmpty?: boolean
  readonly withLabel?: boolean
}

export function NationalitySelect({
  id = 'nationality',
  value,
  onChange,
  className,
  disabled = false,
  allowEmpty = true,
  withLabel = true,
}: NationalitySelectProps) {
  const { data: nationalities = [], isLoading } = useNationalities()
  const emptyLabel = isLoading ? 'Cargando nacionalidades…' : 'Seleccionar nacionalidad'

  return (
    <select
      id={id}
      value={value}
      disabled={disabled || isLoading}
      onChange={(e) => onChange(e.target.value)}
      className={cn(personInputClass, className)}
      style={personInputStyle}
      aria-label={withLabel ? undefined : 'Nacionalidad'}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {nationalities.map((n) => (
        <option key={n.id} value={n.id}>{n.name}</option>
      ))}
    </select>
  )
}
