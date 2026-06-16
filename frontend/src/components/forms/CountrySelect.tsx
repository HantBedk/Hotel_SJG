import { COUNTRY_OPTIONS, countryLabel } from '@/data/countries'
import { cn } from '@/lib/cn'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'

interface CountrySelectProps {
  readonly id?: string
  readonly value: string
  readonly onChange: (code: string) => void
  readonly disabled?: boolean
  readonly className?: string
}

export function CountrySelect({ id, value, onChange, disabled, className }: CountrySelectProps) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(personInputClass, 'disabled:opacity-60', className)}
      style={personInputStyle}
      aria-label="País"
    >
      <option value="">Seleccionar país</option>
      {COUNTRY_OPTIONS.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
      {value && !COUNTRY_OPTIONS.some((c) => c.code === value) && (
        <option value={value}>{countryLabel(value)}</option>
      )}
    </select>
  )
}

export { countryLabel }
