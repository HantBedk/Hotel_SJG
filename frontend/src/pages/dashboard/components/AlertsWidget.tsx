import { AlertTriangle, Bell, ChevronRight, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { collectActiveAlerts, isPersistentRoomAlert } from '../dashboardAlerts'
import DashboardSection from './DashboardSection'
import type { AppNotification, Room } from '@/types'

function resolveCta(n: AppNotification): string {
  if (n.type === 'room_inconsistency') return 'Resolver habitación'
  if (n.type === 'room_cleaning') return 'Ir a habitación'
  if (n.type === 'room_maintenance') return 'Ver orden de mantenimiento'
  if (/low_stock|expir/i.test(n.type)) return 'Ir al inventario'
  if (/maintenance/i.test(n.type)) return 'Ver mantenimiento'
  if (/asset|repair/i.test(n.type)) return 'Ver reparación'
  if (/daily_summary/i.test(n.type)) return 'Ver resumen'
  if (/payment|cancelled/i.test(n.type)) return 'Ver pagos'
  if (/stay_void/i.test(n.type)) return 'Revisar anulación'
  return 'Ver detalle'
}

interface AlertsWidgetProps {
  readonly rooms: Room[]
  readonly onResolve: (n: AppNotification) => void
}

export default function AlertsWidget({ rooms, onResolve }: AlertsWidgetProps) {
  const { notifications, markRead } = useNotifications()
  const recent = collectActiveAlerts(notifications, rooms)

  return (
    <DashboardSection
      id="dashboard-alerts"
      title="Alertas activas"
      description="Incidencias que requieren atención en recepción"
      icon={AlertTriangle}
      iconColor="#F59E0B"
      className="lg:flex-1"
      bodyClassName="!p-3"
      badge={
        recent.length > 0 ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {recent.length}
          </span>
        ) : undefined
      }
    >
      {recent.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Todo en orden — sin alertas pendientes
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-72 lg:max-h-none">
          {recent.map((n) => {
            const cta = resolveCta(n)
            return (
              <div
                key={n.id}
                className="flex items-start gap-1 p-2.5 rounded-lg"
                style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
              >
                <button
                  type="button"
                  onClick={() => onResolve(n)}
                  title="Click para resolver"
                  className="compact-control flex-1 min-w-0 text-left flex items-start gap-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Bell size={12} style={{ color: '#F59E0B' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {n.title}
                    </p>
                    <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {n.message}
                    </p>
                    <p className="text-[11px] mt-1.5 font-semibold inline-flex items-center gap-0.5" style={{ color: 'var(--color-primary)' }}>
                      {cta} <ChevronRight size={12} />
                    </p>
                  </div>
                </button>
                {!isPersistentRoomAlert(n.type) && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    title="Descartar"
                    className="compact-control flex-shrink-0 p-1 rounded hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardSection>
  )
}
