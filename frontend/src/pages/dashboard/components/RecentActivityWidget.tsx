import { Activity } from 'lucide-react'
import type { ActivityLogEntry } from '@/types'
import { formatActivityCardSubtitle, formatActivityCardTitle } from '../utils/activityLogFormat'

interface RecentActivityWidgetProps {
  readonly logs: ActivityLogEntry[]
  readonly onSelect: (log: ActivityLogEntry) => void
}

export default function RecentActivityWidget({ logs, onSelect }: RecentActivityWidgetProps) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col flex-1 min-h-0"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <Activity size={13} style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          Actividad reciente
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-1">
        {logs.slice(0, 12).map((log) => {
          const title = formatActivityCardTitle(log)
          const subtitle = formatActivityCardSubtitle(log)

          return (
          <button
            key={log.id}
            type="button"
            onClick={() => onSelect(log)}
            className="w-full text-left flex items-center justify-between py-1 border-b cursor-pointer rounded px-1 transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border-default)' }}
            title="Click para ver detalles"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {title}
              </p>
              <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            </div>
            <p className="text-[9px] ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {new Date(log.created_at).toLocaleString('es-CO', { timeStyle: 'short', dateStyle: 'short' })}
            </p>
          </button>
          )
        })}
        {logs.length === 0 && (
          <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
            Sin actividad reciente
          </p>
        )}
      </div>
    </div>
  )
}
