import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CheckboxProps {
  readonly id: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly label: ReactNode
  readonly disabled?: boolean
  readonly className?: string
}

export function Checkbox({ id, checked, onChange, label, disabled, className }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn('inline-flex items-center gap-2.5 text-sm cursor-pointer select-none', className)}
      style={{ color: 'var(--text-primary)' }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}
