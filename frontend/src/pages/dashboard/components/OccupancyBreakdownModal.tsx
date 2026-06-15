import { Home, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DashboardStats, RoomStatus } from '@/types'
import { ROOM_COLOR, ROOM_LABEL } from '../constants/roomStatusTheme'
import { occupancyCountForStatus } from '../utils/roomUtils'
import { useDialogLifecycle } from '../hooks/useDialogLifecycle'

interface OccupancyBreakdownModalProps {
  readonly stats: DashboardStats
  readonly onClose: () => void
}

export default function OccupancyBreakdownModal({ stats, onClose }: OccupancyBreakdownModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label="Ocupación actual"
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <Home size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Ocupación actual
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {(Object.keys(ROOM_LABEL) as RoomStatus[]).map((status) => {
            const count = occupancyCountForStatus(status, stats)
            const color = ROOM_COLOR[status]
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {ROOM_LABEL[status]}
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {count}
                </span>
              </div>
            )
          })}

          <div className="border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Total
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.total_rooms} hab.
              </span>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
