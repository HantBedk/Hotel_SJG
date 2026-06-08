import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, BedDouble, Users, CalendarCheck, DollarSign,
  Sparkles, Activity, X, ChevronRight,
  Home, Wrench, XCircle, Check, Calendar, Bell, AlertTriangle,
} from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { useRooms, useHousekeepers } from '@/hooks/useRooms'
import { useStays } from '@/hooks/useStays'
import { useActivityLogs } from '@/hooks/useActivity'
import { useNotifications } from '@/hooks/useNotifications'
import { SkeletonCard } from '@/components/ui/Skeleton'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import { CheckoutWizard } from '@/pages/stays/components/CheckoutWizard'
import CheckInFromReservationModal from '@/pages/reservations/components/CheckInFromReservationModal'
import { DashboardChart } from './components/DashboardChart'
import { DashboardRoomModal } from './components/DashboardRoomModal'
import { formatCOP } from '@/lib/format'
import type { AppNotification, Reservation, Room, RoomStatus, Stay } from '@/types'

function resolveCta(n: AppNotification): string {
  if (n.type === 'room_inconsistency') return 'Resolver habitación'
  if (/low_stock|expir/i.test(n.type))  return 'Ir al inventario'
  if (/maintenance/i.test(n.type))      return 'Ver mantenimiento'
  if (/asset|repair/i.test(n.type))     return 'Ver reparación'
  return 'Resolver'
}

function AlertsWidget({ onResolve }: { onResolve: (n: AppNotification) => void }) {
  const { notifications, unreadCount, markRead } = useNotifications()
  const recent = notifications
    .filter((n) => !n.is_read)
    .filter((n) => /inventory|stock|expir|maintenance|asset|repair|room_inconsistency/i.test(n.type))
    .slice(0, 5)

  return (
    <div
      className="rounded-xl p-3 flex flex-col flex-1 min-h-0"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <AlertTriangle size={13} style={{ color: '#F59E0B' }} />
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          Alertas activas
        </h3>
        {recent.length > 0 && (
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {unreadCount}
          </span>
        )}
      </div>
      {recent.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Sin alertas activas
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
          {recent.map((n) => {
            const cta = resolveCta(n)
            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => onResolve(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onResolve(n)
                  }
                }}
                title="Click para resolver"
                className="flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Bell size={11} style={{ color: '#F59E0B' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                  <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                  <p className="text-[10px] mt-1 font-semibold inline-flex items-center gap-0.5" style={{ color: 'var(--color-primary)' }}>
                    {cta} <ChevronRight size={11} />
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                  title="Descartar"
                  className="flex-shrink-0 p-0.5 rounded hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface PendingBalanceRow {
  stay:    Stay
  total:   number
  paid:    number
  balance: number
}

function PendingBalancesWidget({ items, onSelect }: { items: PendingBalanceRow[]; onSelect: (row: PendingBalanceRow) => void }) {
  const total = items.reduce((acc, it) => acc + it.balance, 0)

  return (
    <div
      className="rounded-xl p-3 flex flex-col flex-1 min-h-0"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <DollarSign size={13} style={{ color: '#EF4444' }} />
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          Saldos pendientes
        </h3>
        {items.length > 0 && (
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Sin saldos pendientes
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {items.map(({ stay, total: t, paid, balance }) => {
              const roomsLabel = (stay.stay_rooms ?? [])
                .filter((sr) => sr.is_active !== false)
                .map((sr) => sr.room?.number)
                .filter(Boolean)
                .join(', ')
              return (
                <div
                  key={stay.id}
                  className="flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  onClick={() => onSelect({ stay, total: t, paid, balance })}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                      >
                        Hab. {roomsLabel || '—'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {stay.guest?.full_name ?? '—'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Total ${t.toLocaleString('es-CO')} · Pagado ${paid.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Saldo
                    </p>
                    <p className="text-xs font-bold tabular-nums" style={{ color: '#EF4444' }}>
                      ${balance.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div
            className="flex items-center justify-between pt-2 mt-2 shrink-0 text-[11px]"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total por cobrar
            </span>
            <span className="font-bold tabular-nums" style={{ color: '#EF4444' }}>
              ${total.toLocaleString('es-CO')}
            </span>
          </div>
        </>
      )}
    </div>
  )
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
  'login':                     'Inicio de sesión',
  'login_failed':              'Login fallido',
  'logout':                    'Cierre de sesión',
  'stay.checkin':              'Check-in',
  'stay.checkout':             'Check-out',
  'stay.payment':              'Pago registrado',
  'stay.service':              'Servicio agregado',
  'stay.transfer':             'Transferencia de habitación',
  'stay.extended':             'Estadía extendida',
  'reservation.created':       'Reserva creada',
  'reservation.cancelled':     'Reserva cancelada',
  'reservation.updated':       'Reserva actualizada',
  'reservation.group_created': 'Reserva grupal creada',
  'reservation.checkin':       'Check-in desde reserva',
  'room_created':              'Habitación creada',
  'room_updated':              'Habitación actualizada',
  'room_deactivated':          'Habitación desactivada',
  'room_status_changed':       'Cambio de estado',
  'room.status_changed':       'Cambio de estado',
  'room.cleaning':             'Limpieza de habitación',
  'room.maintenance':          'Mantenimiento de habitación',
  'inventory.restock':         'Reposición de inventario',
  'inventory.adjust':          'Ajuste de inventario',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { stats, isLoading } = useDashboard()
  const { rooms, isLoading: loadingRooms, changeStatus, isChanging } = useRooms()
  const { data: activityData } = useActivityLogs({ page: 1 })
  const { data: housekeepers = [] } = useHousekeepers()
  const { markRead: markNotificationRead } = useNotifications()

  const [checkingIn, setCheckingIn] = useState<Room[]>([])
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null)
  const [showOccupancy, setShowOccupancy] = useState(false)
  const [selectedBalanceStay, setSelectedBalanceStay] = useState<PendingBalanceRow | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [checkInReservation, setCheckInReservation] = useState<Reservation | null>(null)

  const { stays: activeStays, addPayment } = useStays({ status: 'active' })

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

  const handleResolveAlert = (n: AppNotification) => {
    markNotificationRead(n.id)

    if (n.type === 'room_inconsistency') {
      const roomId = (n.payload as { room_id?: string } | null)?.room_id
      const room = rooms.find((r) => r.id === roomId)
      if (room) {
        setSelectedRoom(room)
        return
      }
    }

    if (n.action_url) navigate(n.action_url)
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
      label:   'Diario',
      value:   stats ? formatCOP(stats.today_room_revenue ?? 0) : '—',
      sub:     'Habitaciones ocupadas esta noche',
      icon:    DollarSign,
      color:   '#16A34A',
      colorBg: '#ECFDF5',
      onClick: () => navigate('/income?preset=today'),
    },
  ]

  const invAlerts = stats?.inventory_alerts
  if (invAlerts && invAlerts.total > 0) {
    const parts: string[] = []
    if (invAlerts.low_stock > 0)         parts.push(`${invAlerts.low_stock} stock bajo`)
    if (invAlerts.expiring > 0)          parts.push(`${invAlerts.expiring} por vencer`)
    if (invAlerts.maintenances_soon > 0) parts.push(`${invAlerts.maintenances_soon} mant.`)
    kpis.push({
      label:   'Alertas inventario',
      value:   invAlerts.total,
      sub:     parts.join(' · '),
      icon:    AlertTriangle,
      color:   '#D97706',
      colorBg: '#FFFBEB',
    })
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 animate-in fade-in duration-300">

      {/* ── KPI cards (fila fija arriba) ──────────────────────────────────── */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 ${kpis.length === 6 ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-3 shrink-0`}>
        {isLoading
          ? Array.from({ length: kpis.length }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map(({ label, value, sub, icon: Icon, color, colorBg, circular, pct, onClick }) => (
            <div
              key={label}
              className={`rounded-xl p-3 flex flex-col justify-between${onClick ? ' cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              style={{
                background:  'var(--bg-surface)',
                border:      '1px solid var(--border-default)',
                boxShadow:   'var(--shadow-sm)',
                minHeight:   '84px',
              }}
              onClick={onClick}
            >
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
                        stroke={color as string} fill="none"
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
            </div>
          ))
        }
      </div>

      {/* ── Main grid: 3 columnas a altura completa, sin scroll de página ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* ── Col A (col-span-6): Habitaciones (arriba) + Gráfico (abajo) ──── */}
        <div className="lg:col-span-6 flex flex-col gap-3 min-h-0">
          {/* Estado de habitaciones — más bajo, deja espacio al gráfico */}
          <div
            className="rounded-xl shadow-sm p-3 flex flex-col min-h-0 flex-[3]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-bold mb-2 shrink-0" style={{ color: 'var(--text-primary)' }}>
              Estado de Habitaciones
            </h3>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {loadingRooms ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg animate-pulse" style={{ background: 'var(--bg-input)' }} />
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin habitaciones configuradas</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
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
              className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 shrink-0 text-[10px] font-bold uppercase tracking-wider"
              style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
            >
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.available }}></div> Disponible</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.occupied }}></div> Ocupada</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.reserved }}></div> Reservada</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.cleaning }}></div> Limpieza</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.maintenance }}></div> Mant.</div>
            </div>
          </div>

          {/* Gráfico de ocupación — debajo de habitaciones */}
          <div className="flex flex-col flex-[2] min-h-0">
            <DashboardChart />
          </div>
        </div>

        {/* ── Col B (col-span-3): Actividad + En limpieza ──────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">

          {/* Actividad reciente */}
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
              {(activityData?.data ?? []).slice(0, 12).map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-1 border-b"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {ACTION_LABELS[log.action] ?? log.action_label}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      {log.user_name}
                    </p>
                  </div>
                  <p className="text-[9px] ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('es-CO', { timeStyle: 'short', dateStyle: 'short' })}
                  </p>
                </div>
              ))}
              {(activityData?.data ?? []).length === 0 && (
                <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  Sin actividad reciente
                </p>
              )}
            </div>
          </div>


        </div>

        {/* ── Col C (col-span-3): Alertas + Saldos pendientes ──────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          <AlertsWidget onResolve={handleResolveAlert} />
          <PendingBalancesWidget items={staysWithBalance} onSelect={setSelectedBalanceStay} />
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
      {selectedBalanceStay && (() => {
        const { stay, total: t, paid, balance } = selectedBalanceStay
        const rooms = (stay.stay_rooms ?? []).filter((sr) => sr.is_active !== false)
        const fmt = (v: number | string) => `$${Number(v).toLocaleString('es-CO')}`
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedBalanceStay(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
              style={{ background: 'var(--bg-surface)', maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} style={{ color: '#EF4444' }} />
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stay.guest?.full_name ?? '—'}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {rooms.map((sr) => `Hab. ${sr.room?.number}`).join(', ') || '—'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedBalanceStay(null)} className="rounded-lg p-1 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                {/* Resumen financiero */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total', value: fmt(t), color: 'var(--text-primary)' },
                    { label: 'Abono', value: fmt(paid), color: '#16a34a' },
                    { label: 'Saldo', value: fmt(balance), color: '#EF4444' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                      <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Habitaciones */}
                {rooms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Habitaciones</p>
                    <div className="space-y-1.5">
                      {rooms.map((sr) => (
                        <div key={sr.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Hab. {sr.room?.number} · {sr.nights} noche{sr.nights !== 1 ? 's' : ''}</span>
                          <span className="tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(sr.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Servicios extras */}
                {(stay.services ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Servicios adicionales</p>
                    <div className="space-y-1.5">
                      {(stay.services ?? []).map((sv) => (
                        <div key={sv.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{sv.extra_service?.name ?? '—'} × {sv.quantity}</span>
                          <span className="tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(sv.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Minibar */}
                {(stay.minibar_consumptions ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Consumo minibar</p>
                    <div className="space-y-1.5">
                      {(stay.minibar_consumptions ?? []).map((mc) => (
                        <div key={mc.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{mc.product_name} × {mc.quantity}</span>
                          <span className="tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(mc.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagos realizados */}
                {(stay.payments ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Pagos realizados</p>
                    <div className="space-y-1.5">
                      {(stay.payments ?? []).map((p) => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>
                            {new Date(p.payment_date).toLocaleDateString('es-CO')} · {p.payment_method}
                          </span>
                          <span className="tabular-nums font-medium" style={{ color: '#16a34a' }}>{fmt(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer saldo */}
              <div className="flex items-center justify-between px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border-default)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Saldo pendiente</span>
                <span className="text-base font-bold tabular-nums" style={{ color: '#EF4444' }}>{fmt(balance)}</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal detalle de habitación */}
      <DashboardRoomModal
        room={selectedRoom}
        stay={stayForSelectedRoom}
        housekeepers={housekeepers}
        isChangingStatus={isChanging}
        onChangeStatus={handleRoomStatusChange}
        onStartCheckIn={(room) => setCheckingIn([room])}
        onStartCheckOut={(stay) => setCheckoutStay(stay)}
        onAddPayment={addPayment}
        onSelectReservation={(reservation) => setCheckInReservation(reservation)}
        onClose={() => setSelectedRoom(null)}
      />

      {/* Checkout wizard (desde modal de habitación) */}
      {checkoutStay && (
        <CheckoutWizard
          stay={checkoutStay}
          onClose={() => setCheckoutStay(null)}
          onSuccess={() => setCheckoutStay(null)}
        />
      )}

      {/* Check-in desde reserva existente (asignada desde modal de habitación) */}
      {checkInReservation && (
        <CheckInFromReservationModal
          reservation={checkInReservation}
          rooms={rooms}
          onClose={() => setCheckInReservation(null)}
          onSuccess={() => setCheckInReservation(null)}
        />
      )}
    </div>
  )
}
