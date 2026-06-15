import { cn } from '@/lib/cn'
import type { PersonNameFields } from '@/types/person'
import { FormField } from './FormField'
import { personInputClass, personInputStyle } from './personFormStyles'

const NAME_FIELDS: {
  key: keyof PersonNameFields
  label: string
  required: boolean
}[] = [
  { key: 'primer_nombre', label: 'Primer nombre', required: true },
  { key: 'segundo_nombre', label: 'Segundo nombre', required: false },
  { key: 'primer_apellido', label: 'Primer apellido', required: true },
  { key: 'segundo_apellido', label: 'Segundo apellido', required: false },
]

interface PersonNameFieldsProps {
  readonly value: PersonNameFields
  readonly onChange: (patch: Partial<PersonNameFields>) => void
  readonly errors?: Partial<Record<keyof PersonNameFields, string>>
  readonly className?: string
  readonly disabled?: boolean
  readonly idPrefix?: string
}

export function PersonNameFieldsInput({
  value,
  onChange,
  errors = {},
  className,
  disabled = false,
  idPrefix = 'person-name',
}: PersonNameFieldsProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {NAME_FIELDS.map(({ key, label, required }) => {
        const id = `${idPrefix}-${key}`
        return (
          <FormField
            key={key}
            id={id}
            label={label}
            required={required}
            error={errors[key]}
          >
            <input
              id={id}
              type="text"
              autoComplete="off"
              value={value[key]}
              disabled={disabled}
              onChange={(e) => onChange({ [key]: e.target.value })}
              className={personInputClass}
              style={personInputStyle}
            />
          </FormField>
        )
      })}
    </div>
  )
}
