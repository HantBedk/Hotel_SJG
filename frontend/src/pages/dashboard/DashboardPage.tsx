import { useState } from 'react'
import {
  Building2, BedDouble, Users, CalendarCheck, DollarSign,
  Sparkles, Clock, Activity, X, TrendingUp, Package, Briefcase,
} from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { useRooms } from '@/hooks/useRooms'
import { useActivityLogs } from '@/hooks/useActivity'
import { useSuggestions, useDismissSuggestion } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonCard } from '@/components/ui/Skeleton'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import { DashboardChart } from './components/DashboardChart'
import type { Room, RoomStatus, Suggestion } from '@/types'

const SUGGESTION_ICONS: Record<string, React.ElementType> = {
  minibar_restock:  Package,
  price_adjustment: TrendingUp,
  corporate_rate:   Briefcase,
}

function SuggestionsWidget() {
  const { hasPermission }                = useAuth()
  const { data: suggestions = [] }       = useSuggestions()
  const { mutate: dismiss, isPending }   = useDismissSuggestion()

  if (!hasPermission('manage_settings') && !hasPermission('view_dashboard')) return null
  if (suggestions.length === 0) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} style={{ color: '#F59E0B' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Sugerencias del día
        </h3>
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: '#FEF3C7', color: '#92400E' }}
        >
          {suggestions.length}
        </span>
      </div>
      <div className="space-y-2">
        {suggestions.map((s: Suggestion) => {
          const Icon = SUGGESTION_ICONS[s.type] ?? Sparkles
          const score = Math.round(parseFloat(s.confidence_score) * 100)
          return (
            <div
              key={s.id}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon size={14} style={{ color: '#F59E0B' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Confianza: {score}%</p>
              </div>
              <button
                onClick={() => dismiss(s.id)}
                disabled={isPending}
                title="Descartar sugerencia"
                className="flex-shrink-0 p-1 rounded hover:bg-red-50"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}
function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const ROOM_COLOR: Record<RoomStatus, string> = {
  available:   '#22C55E',
  occupied:    '#EF4444',
  reserved:    '#F59E0B',
  cleaning:    '#8B5CF6',
  maintenance: '#F97316',
  blocked:     '#94A3B8',
}
const ROOM_LABEL: Record<RoomStatus, string> = {
  available:   'Disponible',
  occupied:    'Ocupada',
  reserved:    'Reservada',
  cleaning:    'Limpieza',
  maintenance: 'Mant.',
  blocked:     'Bloqueada',
}

const ACTION_LABELS: Record<string, string> = {
  'stay.checkin':          'Check-in',
  'stay.checkout':         'Check-out',
  'stay.payment':          'Pago',
  'reservation.created':   'Reserva creada',
  'reservation.cancelled': 'Reserva cancelada',
  'stay.transfer':         'Transferencia',
}

export default function DashboardPage() {
  const { stats, isLoading } = useDashboard()
  const { rooms, isLoading: loadingRooms } = useRooms()
  const { rooms: cleaningRooms } = useRooms('cleaning')
  const { data: activityData } = useActivityLogs({ page: 1 })

  const [checkingIn, setCheckingIn] = useState<Room[]>([])

  const occupancyPct = stats && stats.total_rooms > 0
    ? Math.round((stats.occupied / stats.total_rooms) * 100)
    : 0

  const kpis = [
    {
      label:   'Ocupación actual',
      value:   `${occupancyPct}%`,
      sub:     stats ? `${stats.occupied} de ${stats.total_rooms} hab.` : '—',
      icon:    Building2,
      color:   'var(--color-primary)',
      colorBg: 'var(--color-primary-light)',
      circular: true,
      pct:      occupancyPct,
    },
    {
      label:   'Disponibles',
      value:   stats?.available ?? '—',
      sub:     'Listas para check-in',
      icon:    BedDouble,
      color:   '#22C55E',
      colorBg: '#ECFDF5',
    },
    {
      label:   'Estadías activas',
      value:   stats?.active_stays ?? '—',
      sub:     'Huéspedes en hotel',
      icon:    Users,
      color:   'var(--color-primary)',
      colorBg: 'var(--color-primary-light)',
    },
    {
      label:   'Check-ins hoy',
      value:   stats?.checkins_today ?? '—',
      sub:     'Entradas del día',
      icon:    CalendarCheck,
      color:   '#F59E0B',
      colorBg: '#FFFBEB',
    },
    {
      label:   'Saldo pendiente',
      value:   stats?.pending_balance != null
                 ? `$${Number(stats.pending_balance).toLocaleString('es-CO')}`
                 : '—',
      sub:     'Por cobrar',
      icon:    DollarSign,
      color:   '#EF4444',
      colorBg: '#FFF1F2',
    },
  ]

  return (
    <div className="flex flex-col gap-4 min-h-0 animate-in fade-in duration-300">

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 shrink-0">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map(({ label, value, sub, icon: Icon, color, colorBg, circular, pct }) => (
            <div
              key={label}
              className="rounded-xl p-4 flex flex-col justify-between"
              style={{
                background:  'var(--bg-surface)',
                border:      '1px solid var(--border-default)',
                boxShadow:   'var(--shadow-sm)',
                minHeight:   '96px',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                </div>
                {circular ? (
                  <div className="relative w-11 h-11 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path
                        strokeWidth="4" stroke="var(--border-default)" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        strokeDasharray={`${pct}, 100`} strokeWidth="4" strokeLinecap="round"
                        stroke={color as string} fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <Icon size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color }} />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: colorBg }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0">

        {/* ── Left: room grid ──────────────────────────────────────────────── */}
        <div
          className="xl:col-span-5 rounded-xl p-4 flex flex-col min-h-0"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <h3 className="text-sm font-bold mb-4 shrink-0" style={{ color: 'var(--text-primary)' }}>
            Estado de habitaciones
          </h3>

          <div className="flex-1 overflow-y-auto pr-1">
            {loadingRooms ? (
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-lg animate-pulse" style={{ background: 'var(--bg-input)' }} />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin habitaciones configuradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 xl:grid-cols-5 gap-2">
                {rooms.map((room) => {
                  const bg      = ROOM_COLOR[room.status] ?? '#94A3B8'
                  const isAvail = room.status === 'available'
                  return (
                    <div
                      key={room.id}
                      onClick={() => isAvail && setCheckingIn([room])}
                      className="aspect-[4/3] rounded-lg flex flex-col items-center justify-center shadow-sm transition-transform"
                      style={{
                        background: bg,
                        cursor:     isAvail ? 'pointer' : 'default',
                        transform:  'scale(1)',
                      }}
                      onMouseEnter={(e) => isAvail && ((e.currentTarget as HTMLElement).style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
                      title={`Hab. ${room.number} — ${ROOM_LABEL[room.status]}${isAvail ? ' (click para check-in)' : ''}`}
                    >
                      <span className="font-bold text-sm text-white leading-none drop-shadow-sm">
                        {room.number}
                      </span>
                      {room.floor != null && (
                        <span className="text-[9px] text-white/70 mt-0.5">P{room.floor}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 shrink-0"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            {(Object.entries(ROOM_LABEL) as [RoomStatus, string][]).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: ROOM_COLOR[status] }} />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="xl:col-span-7 flex flex-col gap-4 min-h-0">

          {/* Top row: actividad + en limpieza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">

            {/* Actividad reciente */}
            <div
              className="rounded-xl p-4 flex flex-col min-h-0"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Activity size={14} style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Actividad reciente
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {(activityData?.data ?? []).slice(0, 8).map(log => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-1.5 border-b"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {ACTION_LABELS[log.action] ?? log.action_label}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {log.user_name}
                      </p>
                    </div>
                    <p className="text-[10px] ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('es-CO', { timeStyle: 'short', dateStyle: 'short' })}
                    </p>
                  </div>
                ))}
                {(activityData?.data ?? []).length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    Sin actividad reciente
                  </p>
                )}
              </div>
            </div>

            {/* En limpieza */}
            <div
              className="rounded-xl p-4 flex flex-col min-h-0"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <Sparkles size={14} style={{ color: '#8B5CF6' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  En limpieza
                </h3>
              </div>

              {cleaningRooms.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sin habitaciones en limpieza
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {cleaningRooms.map((room) => {
                    const mins    = minutesSince(room.updated_at)
                    const overdue = mins > 60
                    return (
                      <div
                        key={room.id}
                        className="flex items-center justify-between py-2 border-b"
                        style={{ borderColor: 'var(--border-default)' }}
                      >
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            Hab. {room.number}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {room.room_type.name}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-1 text-xs font-semibold"
                          style={{ color: overdue ? '#EF4444' : 'var(--text-secondary)' }}
                        >
                          <Clock size={11} />
                          {formatMinutes(mins)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: suggestions + occupancy chart */}
          <SuggestionsWidget />
          <DashboardChart />

        </div>
      </div>

      {/* Check-in wizard */}
      {checkingIn.length > 0 && (
        <CheckInWizard
          rooms={checkingIn}
          onClose={() => setCheckingIn([])}
        />
      )}
    </div>
  )
}
