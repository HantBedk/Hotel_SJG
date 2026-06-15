import { Bell, ChevronRight, X, AlertTriangle } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { collectActiveAlerts, isPersistentRoomAlert } from '../dashboardAlerts'
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
            {recent.length}
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
                className="flex items-start gap-1 p-2 rounded-lg"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
              >
                <button
                  type="button"
                  onClick={() => onResolve(n)}
                  title="Click para resolver"
                  className="flex-1 min-w-0 text-left flex items-start gap-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
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
                </button>
                {!isPersistentRoomAlert(n.type) && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    title="Descartar"
                    className="flex-shrink-0 p-0.5 rounded hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
