import { useMemo } from 'react'
import { COLOMBIAN_CITIES } from '@/data/colombianCities'
import { SearchableSelect, type SearchableSelectOption } from './SearchableSelect'

interface CitySelectProps {
  readonly id?: string
  readonly value: string
  readonly onChange: (city: string) => void
  readonly disabled?: boolean
  readonly className?: string
}

function buildCityOptions(value: string): SearchableSelectOption[] {
  const cities = new Set<string>(COLOMBIAN_CITIES)
  if (value.trim()) cities.add(value.trim())
  return [...cities]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((city) => ({ value: city, label: city }))
}

export function CitySelect({ id, value, onChange, disabled, className }: CitySelectProps) {
  const options = useMemo(() => buildCityOptions(value), [value])

  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Buscar ciudad…"
      disabled={disabled}
      className={className}
      ariaLabel="Ciudad"
    />
  )
}
