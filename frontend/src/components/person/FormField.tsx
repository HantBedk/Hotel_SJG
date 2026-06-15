import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { personLabelClass, personSectionTitleClass, personSectionHintClass } from './personFormStyles'

interface FormFieldProps {
  readonly id: string
  readonly label: string
  readonly required?: boolean
  readonly error?: string
  readonly hint?: string
  readonly className?: string
  readonly children: ReactNode
}

export function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={personLabelClass} style={{ color: 'var(--text-secondary)' }}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
      {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
    </div>
  )
}

interface FormSectionProps {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h3 className={personSectionTitleClass} style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
        {description && (
          <p className={personSectionHintClass} style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}
