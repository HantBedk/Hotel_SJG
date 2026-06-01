import { BedDouble, Users, CalendarCheck, Sparkles, DollarSign } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function DashboardPage() {
  const { stats, isLoading } = useDashboard()

  const cards = [
    {
      label:   'Habitaciones disponibles',
      value:   stats?.available,
      icon:    BedDouble,
      color:   'var(--status-available)',
      colorBg: '#ECFDF5',
    },
    {
      label:   'Estadías activas',
      value:   stats?.active_stays,
      icon:    Users,
      color:   'var(--color-primary)',
      colorBg: 'var(--color-primary-light)',
    },
    {
      label:   'Check-ins hoy',
      value:   stats?.checkins_today,
      icon:    CalendarCheck,
      color:   'var(--status-reserved)',
      colorBg: '#FFFBEB',
    },
    {
      label:   'Por hacer limpieza',
      value:   stats?.cleaning,
      icon:    Sparkles,
      color:   'var(--status-cleaning)',
      colorBg: '#F5F3FF',
    },
    {
      label:   'Saldo pendiente',
      value:   stats?.pending_balance != null
                 ? `$${Number(stats.pending_balance).toLocaleString('es-CO')}`
                 : undefined,
      icon:    DollarSign,
      color:   'var(--status-occupied)',
      colorBg: '#FFF1F2',
    },
  ]

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map(({ label, value, icon: Icon, color, colorBg }) => (
            <div
              key={label}
              className="rounded-xl p-5 flex items-start gap-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: colorBg }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {value ?? '—'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Estado de habitaciones */}
      {!isLoading && stats && (
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Estado de habitaciones
          </h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(stats.rooms_by_status).map(([status, count]) => {
              const COLOR: Record<string, string> = {
                available:   'var(--status-available)',
                occupied:    'var(--status-occupied)',
                reserved:    'var(--status-reserved)',
                cleaning:    'var(--status-cleaning)',
                maintenance: 'var(--status-maintenance)',
                blocked:     'var(--status-blocked)',
              }
              const LABEL: Record<string, string> = {
                available:   'Disponibles',
                occupied:    'Ocupadas',
                reserved:    'Reservadas',
                cleaning:    'Limpieza',
                maintenance: 'Mantenimiento',
                blocked:     'Bloqueadas',
              }
              return (
                <div key={status} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLOR[status] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{LABEL[status]}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* Mini bar chart */}
          <div className="mt-4 flex gap-1 h-6 rounded-lg overflow-hidden">
            {Object.entries(stats.rooms_by_status).map(([status, count]) => {
              if (count === 0) return null
              const pct = Math.round((count / stats.total_rooms) * 100)
              const COLOR: Record<string, string> = {
                available:   'var(--status-available)',
                occupied:    'var(--status-occupied)',
                reserved:    'var(--status-reserved)',
                cleaning:    'var(--status-cleaning)',
                maintenance: 'var(--status-maintenance)',
                blocked:     'var(--status-blocked)',
              }
              return (
                <div
                  key={status}
                  style={{ width: `${pct}%`, background: COLOR[status], minWidth: '4px' }}
                  title={`${status}: ${count}`}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
