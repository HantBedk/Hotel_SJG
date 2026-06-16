import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'

export interface SearchableSelectOption {
  readonly value: string
  readonly label: string
}

interface SearchableSelectProps {
  readonly id?: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: readonly SearchableSelectOption[]
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly className?: string
  readonly ariaLabel?: string
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Buscar…',
  disabled = false,
  className,
  ariaLabel,
}: SearchableSelectProps) {
  const listId = useId()

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        list={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(personInputClass, 'pr-9', className)}
        style={personInputStyle}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}
