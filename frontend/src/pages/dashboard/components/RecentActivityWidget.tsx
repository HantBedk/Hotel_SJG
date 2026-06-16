import { Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ActivityLogEntry } from '@/types'
import { formatActivityCardSubtitle, formatActivityCardTitle } from '../utils/activityLogFormat'
import DashboardSection from './DashboardSection'

interface RecentActivityWidgetProps {
  readonly logs: ActivityLogEntry[]
  readonly onSelect: (log: ActivityLogEntry) => void
}

function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { timeStyle: 'short', dateStyle: 'short' })
}

interface ActivityRowProps {
  readonly log: ActivityLogEntry
  readonly onSelect: (log: ActivityLogEntry) => void
}

function ActivityRow({ log, onSelect }: ActivityRowProps) {
  const title = formatActivityCardTitle(log)
  const subtitle = formatActivityCardSubtitle(log)
  const time = formatActivityTime(log.created_at)

  return (
    <button
      type="button"
      onClick={() => onSelect(log)}
      className="compact-control w-full text-left py-2.5 px-4 cursor-pointer transition-colors hover:bg-[var(--bg-muted)]"
      title="Ver detalle"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <p
          className="text-xs font-medium leading-snug line-clamp-2 min-w-0 flex-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </p>
        <time
          className="text-[10px] shrink-0 tabular-nums pt-0.5 whitespace-nowrap"
          style={{ color: 'var(--text-muted)' }}
          dateTime={log.created_at}
        >
          {time}
        </time>
      </div>
      {subtitle && (
        <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </button>
  )
}

export default function RecentActivityWidget({ logs, onSelect }: RecentActivityWidgetProps) {
  const navigate = useNavigate()
  const items = logs.slice(0, 12)

  return (
    <DashboardSection
      id="dashboard-activity"
      title="Actividad reciente"
      description="Movimientos del hotel"
      icon={Activity}
      className="lg:flex-1 lg:min-h-0"
      bodyClassName="!p-0 flex flex-col min-h-0"
      actions={
        <button
          type="button"
          onClick={() => navigate('/activity')}
          className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:opacity-80 whitespace-nowrap"
          style={{ color: 'var(--color-primary)' }}
        >
          Ver todo
        </button>
      }
    >
      <div
        className="flex-1 overflow-y-auto min-h-0 max-h-80 lg:max-h-none divide-y"
        style={{ borderColor: 'var(--border-default)' }}
      >
        {items.map((log) => (
          <ActivityRow key={log.id} log={log} onSelect={onSelect} />
        ))}
        {items.length === 0 && (
          <p className="text-xs text-center py-10 px-4" style={{ color: 'var(--text-muted)' }}>
            Sin actividad reciente
          </p>
        )}
      </div>
    </DashboardSection>
  )
}
