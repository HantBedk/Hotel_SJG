import { useState } from 'react'
import {
  Building2, BedDouble, Users, CalendarCheck, DollarSign,
  Sparkles, Clock, Activity, X, TrendingUp, Package, Briefcase,
  Home, Wrench, XCircle, Check, Calendar, Bell, AlertTriangle,
} from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { useRooms, useHousekeepers } from '@/hooks/useRooms'
import { useStays } from '@/hooks/useStays'
import { useActivityLogs } from '@/hooks/useActivity'
import { useSuggestions, useDismissSuggestion } from '@/hooks/useActivity'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonCard } from '@/components/ui/Skeleton'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import { DashboardChart } from './components/DashboardChart'
import { DashboardRoomModal } from './components/DashboardRoomModal'
import type { Room, RoomStatus, Suggestion, Stay } from '@/types'

const SUGGESTION_ICONS: Record<string, React.ElementType> = {
  minibar_restock:  Package,
  price_adjustment: TrendingUp,
  corporate_rate:   Briefcase,
}

function AlertsWidget() {
  const { notifications, unreadCount, markRead } = useNotifications()
  const recent = notifications
    .filter((n) => !n.is_read)
    .filter((n) => /inventory|stock|expir|maintenance|asset|repair/i.test(n.type))
    .slice(0, 5)

  if (recent.length === 0) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Alertas activas
        </h3>
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: '#FEE2E2', color: '#991B1B' }}
        >
          {unreadCount}
        </span>
      </div>
      <div className="space-y-2">
        {recent.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Bell size={13} style={{ color: '#F59E0B' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
            </div>
            <button
              onClick={() => markRead(n.id)}
              title="Marcar leída"
              className="flex-shrink-0 p-1 rounded hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
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
  const { rooms, isLoading: loadingRooms, changeStatus, isChanging } = useRooms()
  const { rooms: cleaningRooms } = useRooms('cleaning')
  const { data: activityData } = useActivityLogs({ page: 1 })
  const { data: housekeepers = [] } = useHousekeepers()

  const [checkingIn, setCheckingIn] = useState<Room[]>([])
  const [showOccupancy, setShowOccupancy] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const { stays: activeStays } = useStays({ status: 'active' })

  const stayForSelectedRoom = selectedRoom
    ? (activeStays as Stay[]).find((s) =>
        (s.stay_rooms ?? []).some((sr) => sr.room?.id === selectedRoom.id && sr.is_active !== false)
      ) ?? null
    : null

  const handleRoomStatusChange = (id: string, status: RoomStatus, notes?: string) => {
    changeStatus(
      { id, status, notes },
      { onSuccess: () => setSelectedRoom(null) },
    )
  }
  const staysWithBalance = (activeStays as Stay[])
    .map((s) => {
      const total   = Number(s.total_amount ?? 0)
      const paid    = Number(s.paid_amount ?? 0)
      const balance = total - paid
      return { stay: s, total, paid, balance }
    })
    .filter((s) => s.balance > 0)
    .sort((a, b) => b.balance - a.balance)

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
      onClick:  () => setShowOccupancy(true),
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
      onClick: () => setShowBalance(true),
    },
  ]

  return (
    <div className="flex flex-col gap-4 min-h-0 animate-in fade-in duration-300">

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 shrink-0">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map(({ label, value, sub, icon: Icon, color, colorBg, circular, pct, onClick }) => (
            <div
              key={label}
              className={`rounded-xl p-4 flex flex-col justify-between${onClick ? ' cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              style={{
                background:  'var(--bg-surface)',
                border:      '1px solid var(--border-default)',
                boxShadow:   'var(--shadow-sm)',
                minHeight:   '96px',
              }}
              onClick={onClick}
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
          className="xl:col-span-5 rounded-xl shadow-sm p-4 flex flex-col min-h-0"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <h3 className="text-[15px] font-bold mb-4 shrink-0" style={{ color: 'var(--text-primary)' }}>
            Estado de Habitaciones
          </h3>

          <div className="flex-1 overflow-y-auto pr-2">
            {loadingRooms ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-5 gap-2.5">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-lg animate-pulse" style={{ background: 'var(--bg-input)' }} />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin habitaciones configuradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-5 gap-2.5">
                {rooms.map((room) => {
                  const bg = ROOM_COLOR[room.status] ?? '#94A3B8'
                  const StatusIcon =
                    room.status === 'cleaning'    ? Sparkles  :
                    room.status === 'maintenance' ? Wrench    :
                    room.status === 'blocked'     ? XCircle   :
                    room.status === 'reserved'    ? Calendar  :
                    room.status === 'occupied'    ? Check     :
                    null

                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className="text-white rounded-lg p-1.5 aspect-[4/3] flex flex-col items-center justify-between shadow-sm transition-transform hover:scale-105 cursor-pointer"
                      style={{ background: bg }}
                      title={`Hab. ${room.number} — ${ROOM_LABEL[room.status]} (click para ver detalle)`}
                    >
                      <span className="self-end">
                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5 opacity-90" />}
                      </span>
                      <span className="font-bold text-sm leading-none">{room.number}</span>
                      <span />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div
            className="flex items-center justify-between mt-4 pt-3 shrink-0 text-[10px] font-bold uppercase tracking-wider"
            style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
          >
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.available }}></div> Disponible</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.occupied }}></div> Ocupada</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.reserved }}></div> Reservada</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.cleaning }}></div> Limpieza</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.maintenance }}></div> Mant.</div>
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

          {/* Bottom: alertas + suggestions + occupancy chart */}
          <AlertsWidget />
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

      {/* Modal ocupación */}
      {showOccupancy && stats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowOccupancy(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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
                onClick={() => setShowOccupancy(false)}
                className="rounded-lg p-1 transition-colors hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              {(Object.keys(ROOM_LABEL) as RoomStatus[]).map((status) => {
                const by = (stats as any).rooms_by_status ?? {}
                const count: number =
                  status === 'available' ? stats.available :
                  status === 'occupied'  ? stats.occupied  :
                  status === 'cleaning'  ? (stats.cleaning ?? 0) :
                  (by[status] ?? 0)
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

              {/* Divisor + total */}
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
        </div>
      )}

      {/* Modal saldo pendiente */}
      {showBalance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowBalance(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            style={{ background: 'var(--bg-surface)', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={16} style={{ color: '#EF4444' }} />
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Saldo pendiente por habitación
                </h2>
              </div>
              <button
                onClick={() => setShowBalance(false)}
                className="rounded-lg p-1 transition-colors hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto">
              {staysWithBalance.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No hay estadías con saldo pendiente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staysWithBalance.map(({ stay, total, paid, balance }) => {
                    const rooms = (stay.stay_rooms ?? [])
                      .filter((sr) => sr.is_active !== false)
                      .map((sr) => sr.room?.number)
                      .filter(Boolean)
                      .join(', ')
                    return (
                      <div
                        key={stay.id}
                        className="rounded-lg p-3 border"
                        style={{
                          background: 'var(--bg-input)',
                          borderColor: 'var(--border-default)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded"
                                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                              >
                                Hab. {rooms || '—'}
                              </span>
                              {stay.company && (
                                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                  · {stay.company.name}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {stay.guest?.full_name ?? '—'}
                            </p>
                            <div
                              className="flex items-center gap-3 mt-1 text-[11px]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <span>Total: ${total.toLocaleString('es-CO')}</span>
                              <span>Pagado: ${paid.toLocaleString('es-CO')}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                              Saldo
                            </p>
                            <p className="text-base font-bold tabular-nums" style={{ color: '#EF4444' }}>
                              ${balance.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer total */}
            {staysWithBalance.length > 0 && (
              <div
                className="px-5 py-3 border-t flex items-center justify-between shrink-0"
                style={{ borderColor: 'var(--border-default)', background: 'var(--bg-input)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total por cobrar ({staysWithBalance.length})
                </span>
                <span className="text-base font-bold tabular-nums" style={{ color: '#EF4444' }}>
                  ${staysWithBalance.reduce((acc, s) => acc + s.balance, 0).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal detalle de habitación */}
      <DashboardRoomModal
        room={selectedRoom}
        stay={stayForSelectedRoom}
        housekeepers={housekeepers}
        isChangingStatus={isChanging}
        onChangeStatus={handleRoomStatusChange}
        onStartCheckIn={(room) => setCheckingIn([room])}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  )
}
