import type { ElementType, ReactNode } from 'react'

export interface DashboardSectionProps {
  readonly id?: string
  readonly title: string
  readonly description?: string
  readonly icon?: ElementType
  readonly iconColor?: string
  readonly badge?: ReactNode
  readonly actions?: ReactNode
  readonly children: ReactNode
  readonly className?: string
  readonly bodyClassName?: string
  readonly noPadding?: boolean
}

export default function DashboardSection({
  id,
  title,
  description,
  icon: Icon,
  iconColor = 'var(--color-primary)',
  badge,
  actions,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}: DashboardSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={`rounded-xl flex flex-col min-h-0 overflow-hidden shadow-sm ${className}`}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <header
        className="flex items-start justify-between gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-muted)' }}
      >
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--bg-surface)', color: iconColor }}
            >
              <Icon size={18} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                id={id ? `${id}-title` : undefined}
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h2>
              {badge}
            </div>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </header>
      <div className={`flex-1 min-h-0 flex flex-col ${noPadding ? '' : 'p-4'} ${bodyClassName}`}>
        {children}
      </div>
    </section>
  )
}
