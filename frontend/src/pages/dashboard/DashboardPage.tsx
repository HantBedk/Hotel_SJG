import { useState } from 'react'
import {
  BedDouble, Users, CalendarCheck, Sparkles, DollarSign,
  LogIn, Clock, Bell, Lightbulb, ChevronRight,
} from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { useRooms } from '@/hooks/useRooms'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonCard } from '@/components/ui/Skeleton'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import type { Room } from '@/types'

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function DashboardPage() {
  const { stats, isLoading } = useDashboard()
  const { rooms: availableRooms, isLoading: loadingAvailable } = useRooms('available')
  const { rooms: cleaningRooms } = useRooms('cleaning')
  const { hasPermission } = useAuth()
  const isAdmin = hasPermission('manage_settings')

  const [checkingIn, setCheckingIn] = useState<Room[]>([])

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
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
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

      {/* Room status bar */}
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

      {/* Bottom panels: check-in rápido + alertas + sugerencias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick check-in — available rooms */}
        <div
          className="lg:col-span-2 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Check-in rápido
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Habitaciones disponibles
            </span>
          </div>

          {loadingAvailable ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="p-8 text-center">
              <BedDouble size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay habitaciones disponibles
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
              {availableRooms.slice(0, 8).map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Hab. {room.number}
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                      {room.room_type.name}
                      {room.house && ` · ${room.house.name}`}
                    </span>
                  </div>
                  <button
                    onClick={() => setCheckingIn([room])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    <LogIn size={12} />
                    Check-in
                  </button>
                </div>
              ))}
              {availableRooms.length > 8 && (
                <div className="px-5 py-3 text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    +{availableRooms.length - 8} más — ve a Habitaciones para ver todas
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cleaning rooms with time elapsed */}
          {cleaningRooms.length > 0 && (
            <>
              <div className="px-5 py-3 border-t border-b" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  En limpieza
                </p>
              </div>
              {cleaningRooms.slice(0, 4).map((room) => {
                const mins = minutesSince(room.updated_at)
                return (
                  <div key={room.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} style={{ color: 'var(--status-cleaning)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Hab. {room.number}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs" style={{ color: mins > 60 ? 'var(--status-occupied)' : 'var(--text-muted)' }}>
                      <Clock size={11} />
                      {formatMinutes(mins)}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Right column: alertas + sugerencias */}
        <div className="space-y-4">

          {/* Alertas recientes */}
          <div
            className="rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Alertas recientes</h2>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="p-4 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Sin alertas activas
              </p>
            </div>
          </div>

          {/* Sugerencias — solo admin/superadmin */}
          {isAdmin && (
            <div
              className="rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <Lightbulb size={14} style={{ color: '#8B5CF6' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sugerencias</h2>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Disponible en Fase 6
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check-in wizard launched from dashboard */}
      {checkingIn.length > 0 && (
        <CheckInWizard
          rooms={checkingIn}
          onClose={() => setCheckingIn([])}
        />
      )}
    </div>
  )
}
