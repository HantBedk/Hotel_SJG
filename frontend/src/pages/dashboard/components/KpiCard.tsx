import type { ElementType } from 'react'

interface KpiCardProps {
  readonly label: string
  readonly value: string | number
  readonly sub: string
  readonly icon: ElementType
  readonly color: string
  readonly colorBg: string
  readonly circular?: boolean
  readonly pct?: number
  readonly selected?: boolean
  readonly onClick?: () => void
}

export default function KpiCard({
  label, value, sub, icon: Icon, color, colorBg, circular, pct = 0, selected, onClick,
}: KpiCardProps) {
  const cardStyle = {
    background: 'var(--bg-surface)',
    border: selected ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
    boxShadow: selected ? '0 0 0 1px var(--color-primary-light)' : 'var(--shadow-sm)',
    minHeight: '84px',
  }
  const cardClass = `rounded-xl p-3 flex flex-col justify-between${onClick ? ' cursor-pointer hover:opacity-90 transition-opacity' : ''}`

  const content = (
    <>
      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="flex items-end justify-between mt-1.5">
        <div>
          <p className="text-2xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
        {circular ? (
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                strokeWidth="4" stroke="var(--border-default)" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeDasharray={`${pct}, 100`} strokeWidth="4" strokeLinecap="round"
                stroke={color} fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Icon size={13} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color }} />
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: colorBg }}
          >
            <Icon size={18} style={{ color }} />
          </div>
        )}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={`${cardClass} w-full text-left`} style={cardStyle} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={cardClass} style={cardStyle}>{content}</div>
}
