import { useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useActivityLogs, useActivityActions } from '@/hooks/useActivity'
import { useAdminUsers } from '@/hooks/useAdmin'
import type { ActivityFilters } from '@/services/activity.service'
import type { ActivityLogEntry } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  'stay.checkin':            { bg: '#D1FAE5', color: '#065F46' },
  'stay.checkout':           { bg: '#FEE2E2', color: '#991B1B' },
  'stay.payment':            { bg: '#DBEAFE', color: '#1E40AF' },
  'stay.payment_cancelled':  { bg: '#FEE2E2', color: '#991B1B' },
  'stay.service':            { bg: '#EDE9FE', color: '#5B21B6' },
  'stay.transfer':           { bg: '#FEF3C7', color: '#92400E' },
  'stay.minibar_cancelled':  { bg: '#FEE2E2', color: '#991B1B' },
  'stay.minibar':            { bg: '#DBEAFE', color: '#1E40AF' },
  'minibar_sale.created':    { bg: '#DBEAFE', color: '#1E40AF' },
  'minibar_sale.paid':       { bg: '#D1FAE5', color: '#065F46' },
  'minibar_sale.cancelled':  { bg: '#FEE2E2', color: '#991B1B' },
  'reservation.created':   { bg: '#D1FAE5', color: '#065F46' },
  'reservation.cancelled': { bg: '#FEE2E2', color: '#991B1B' },
  'login':                 { bg: '#E0F2FE', color: '#0369A1' },
  'logout':                { bg: '#F3F4F6', color: '#374151' },
  'login_failed':          { bg: '#FEE2E2', color: '#991B1B' },
  'room_created':          { bg: '#D1FAE5', color: '#065F46' },
  'room.status_changed':   { bg: '#FEF3C7', color: '#92400E' },
  'inventory.restock':     { bg: '#D1FAE5', color: '#065F46' },
}

interface LogRowProps {
  readonly log: ActivityLogEntry
}

function LogRow({ log }: LogRowProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = ACTION_COLORS[log.action] ?? { bg: '#F3F4F6', color: '#374151' }

  return (
    <>
      <tr
        style={{ borderBottom: '1px solid var(--border-default)', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <td className="py-2 pr-2">
          {expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
        </td>
        <td className="py-2 text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
        </td>
        <td className="py-2 px-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium" style={colors}>
            {log.action_label}
          </span>
        </td>
        <td className="py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{log.user_name}</td>
      </tr>
      {expanded && log.payload && (
        <tr style={{ background: 'var(--bg-muted)' }}>
          <td colSpan={4} className="px-6 py-3">
            <pre className="text-xs overflow-x-auto" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AuditoriaTab() {
  const [filters, setFilters] = useState<ActivityFilters>({ page: 1 })
  const { data, isLoading }   = useActivityLogs(filters)
  const { data: actions = [] } = useActivityActions()
  const { data: users = [] }  = useAdminUsers()

  const logs  = data?.data ?? []
  const total = data?.total ?? 0
  const pages = data?.last_page ?? 1
  const page  = data?.current_page ?? 1

  const setFilter = (key: keyof ActivityFilters, value: string) =>
    setFilters(f => ({ ...f, [key]: value || undefined, page: 1 }))

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            placeholder="Desde"
            value={filters.date_from ?? ''}
            onChange={e => setFilter('date_from', e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>
        <input
          type="date"
          placeholder="Hasta"
          value={filters.date_to ?? ''}
          onChange={e => setFilter('date_to', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        />
        <select
          value={filters.action ?? ''}
          onChange={e => setFilter('action', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <option value="">Todas las acciones</option>
          {actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <select
          value={filters.user_id ?? ''}
          onChange={e => setFilter('user_id', e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <option value="">Todos los usuarios</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <span className="ml-auto text-xs self-center" style={{ color: 'var(--text-muted)' }}>
          {total} registros
        </span>
      </div>

      {/* Tabla */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-default)' }}
      >
        {isLoading ? (
          <div className="p-4"><SkeletonText lines={5} /></div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-default)' }}>
                <th className="w-6 py-2 pl-3" />
                <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Acción</th>
                <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>Usuario</th>
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                    No hay registros con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                logs.map(log => <LogRow key={log.id} log={log} />)
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            disabled={page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            ← Anterior
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Pág. {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
