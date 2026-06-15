import { X, Loader2 } from 'lucide-react'
import type { StayRoom } from '@/types'

interface StayDrawerHeaderProps {
  readonly activeRooms: readonly StayRoom[]
  readonly isLoading: boolean
  readonly onClose: () => void
}

export function StayDrawerHeader({ activeRooms, isLoading, onClose }: StayDrawerHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
          Detalle de estadía
        </h2>
        {activeRooms.length > 0 && (
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            Hab. {activeRooms.map((sr) => sr.room?.number ?? '—').join(', ')}
          </span>
        )}
        {isLoading && <Loader2 size={14} className="animate-spin shrink-0" style={{ color: 'var(--text-muted)' }} />}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
        style={{ background: 'var(--bg-input)' }}
        aria-label="Cerrar"
      >
        <X size={16} style={{ color: 'var(--text-secondary)' }} />
      </button>
    </div>
  )
}
