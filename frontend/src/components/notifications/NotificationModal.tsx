import { useState, useEffect } from 'react'
import { AlertTriangle, Bell, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { isNotificationUnread } from '@/pages/dashboard/dashboardAlerts'
import type { AppNotification } from '@/types'

function notificationSeverityColor(severity: AppNotification['severity']): string {
  if (severity === 'critical') return '#DC2626'
  if (severity === 'warning') return '#D97706'
  return 'var(--color-primary)'
}

/**
 * Muestra notificaciones críticas/warning marcadas como is_modal=true.
 * El usuario debe leerlas explícitamente para cerrarlas. El registro
 * persistente queda en la tabla notifications (no se borra).
 */
export default function NotificationModal() {
  const { notifications, markRead } = useNotifications()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const pending = notifications.filter(
    (n) => n.is_modal && isNotificationUnread(n) && !dismissed.has(n.id),
  )

  const current = pending[0]
  const dialogRef = useFocusTrap<HTMLDivElement>(!!current)

  // Cuando llega una nueva notificación, sale del dismissed local para que vuelva a aparecer si no se leyó.
  useEffect(() => {
    if (!current) setDismissed(new Set())
  }, [current])

  if (!current) return null

  const severityColor = notificationSeverityColor(current.severity)

  const handleAcknowledge = () => {
    markRead(current.id)
    setDismissed((prev) => new Set(prev).add(current.id))
  }

  const handleLater = () => {
    setDismissed((prev) => new Set(prev).add(current.id))
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-notification-title"
        className="w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${severityColor}22`, color: severityColor }}
          >
            {current.severity === 'info' ? <Bell size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="flex-1">
            <h2 id="modal-notification-title" className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {current.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {new Date(current.created_at).toLocaleString('es-CO')}
            </p>
          </div>
          <button
            onClick={handleLater}
            aria-label="Cerrar (no marca como leída)"
            className="p-1 rounded-md hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {current.message}
        </p>

        {pending.length > 1 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {pending.length - 1} alerta(s) más pendientes después de esta.
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleLater}
            className="flex-1 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Recordarme luego
          </button>
          <button
            onClick={handleAcknowledge}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: severityColor }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
