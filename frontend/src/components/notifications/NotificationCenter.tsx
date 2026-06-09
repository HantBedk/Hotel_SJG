import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Bell, CheckCheck, AlertTriangle, Package, Wrench, ChevronRight } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Skeleton } from '@/components/ui/Skeleton'
import type { AppNotification } from '@/types'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  low_stock:       <Package size={16} className="text-amber-500" />,
  expiring_product: <AlertTriangle size={16} className="text-orange-500" />,
  maintenance_due: <Wrench size={16} className="text-blue-500" />,
  reservation_alert: <Bell size={16} className="text-purple-500" />,
}

function NotifRow({ n, onRead, onNavigate }: { n: AppNotification; onRead: (id: string) => void; onNavigate: (url: string) => void }) {
  const icon = TYPE_ICONS[n.type] ?? <Bell size={16} className="text-slate-400" />

  return (
    <button
      onClick={() => {
        if (!n.is_read) onRead(n.id)
        if (n.action_url) onNavigate(n.action_url)
      }}
      className="w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
      style={{ opacity: n.is_read ? 0.6 : 1 }}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {n.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {n.message}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {new Date(n.created_at).toLocaleString('es-CO', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {!n.is_read && (
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        )}
        {n.action_url && (
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
    </button>
  )
}

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export default function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { notifications, isLoading, unreadCount, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  const handleNavigate = (url: string) => {
    onClose()
    navigate(url)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-96 rounded-xl shadow-2xl border z-50 flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
        maxHeight: '480px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Notificaciones
          </span>
          {unreadCount > 0 && (
            <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              title="Marcar todas como leídas"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <CheckCheck size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-full rounded" />
                  <Skeleton className="h-2 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin notificaciones</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {notifications.map((n) => (
              <NotifRow key={n.id} n={n} onRead={markRead} onNavigate={handleNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
