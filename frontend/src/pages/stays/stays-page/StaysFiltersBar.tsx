import { Search } from 'lucide-react'
import { STAY_FILTERS } from './utils'

interface StaysFiltersBarProps {
  readonly statusFilter: string
  readonly guestSearch: string
  readonly onStatusChange: (key: string) => void
  readonly onGuestSearchChange: (value: string) => void
}

export function StaysFiltersBar({
  statusFilter, guestSearch, onStatusChange, onGuestSearchChange,
}: StaysFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STAY_FILTERS.map(({ key, label }) => {
        const isActive = statusFilter === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onStatusChange(key)}
            className="px-4 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              borderColor: isActive ? 'transparent' : 'var(--border-default)',
            }}
          >
            {label}
          </button>
        )
      })}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border ml-auto"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
      >
        <Search size={13} style={{ color: 'var(--text-muted)' }} />
        <input
          value={guestSearch}
          onChange={(e) => onGuestSearchChange(e.target.value)}
          placeholder="Buscar huésped o empresa…"
          className="bg-transparent text-xs outline-none w-44"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  )
}
