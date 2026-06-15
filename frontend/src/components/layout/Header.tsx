import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Moon, Sun, Menu, Settings as SettingsIcon, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useHotelStore } from '@/store/hotelStore'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUnreadCountApi } from '@/services/notifications.service'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import { useReverb } from '@/hooks/useReverb'
import { useSwitchHotel } from '@/hooks/useSwitchHotel'
import { hotelQueryKey, useHotelQueryKey } from '@/lib/hotelQueryKey'
import { getDefaultSettingsPath } from '@/components/layout/sidebar'

interface NotificationBroadcast {
  id:         string
  user_id:    string | null
  type:       string
  title:      string
  message:    string | null
  severity:   'info' | 'warning' | 'critical' | null
  is_modal:   boolean
  action_url: string | null
  created_at: string
}

function notificationToastIcon(severity: NotificationBroadcast['severity']): string {
  if (severity === 'critical') return '🚨'
  if (severity === 'warning') return '⚠️'
  return '🔔'
}

function notificationToastMessage(title: string, message: string | null): string {
  if (!message) return title
  return `${title} — ${message}`
}

interface HeaderProps {
  readonly title: string
  readonly onToggleSidebar?: () => void
  readonly darkMode: boolean
  readonly onToggleDark: () => void
}

export default function Header({ title, onToggleSidebar, darkMode, onToggleDark }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const { logout, hasAnyPermission } = useAuth()
  const navigate = useNavigate()
  const settingsPath = getDefaultSettingsPath(hasAnyPermission)
  const switchHotel = useSwitchHotel()
  const queryClient = useQueryClient()
  const hotels = useHotelStore((s) => s.hotels)
  const currentHotelId = useHotelStore((s) => s.currentHotelId)
  const canSwitchHotel = useHotelStore((s) => s.canSwitchHotel)
  const isSwitchingHotel = useHotelStore((s) => s.isSwitchingHotel)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú al click fuera
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  const notificationsUnreadKey = useHotelQueryKey('notifications-unread')
  const { data: unreadCount = 0 } = useQuery({
    queryKey: notificationsUnreadKey,
    queryFn: getUnreadCountApi,
    refetchInterval: 60_000,
  })

  // Real-time notification: invalidar queries y mostrar toast si el evento
  // está dirigido al usuario actual. El backend emite por user_id, pero el
  // canal es compartido — por eso filtramos en cliente.
  const notifChannel = currentHotelId
    ? `hotel.${currentHotelId}.notifications`
    : 'hotel.notifications'

  useReverb<NotificationBroadcast>({
    channel: notifChannel,
    event:   'notification.created',
    onEvent: (n) => {
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications-unread') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications') })

      if (n.user_id !== user?.id) return
      // Los is_modal abren NotificationModal automáticamente — no duplicar con toast.
      if (n.is_modal) return

      const opts = {
        duration: n.severity === 'critical' ? 8000 : 5000,
        icon:     notificationToastIcon(n.severity),
      }
      toast(notificationToastMessage(n.title, n.message), opts)
    },
    enabled: !!user && !!currentHotelId,
  })

  return (
    <header
      className="flex items-center gap-4 px-6 h-16 border-b"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {/* Page title */}
      <h1
        className="text-lg font-semibold flex-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>

      {/* Hotel selector / label */}
      {hotels.length > 0 && (
        canSwitchHotel ? (
          <select
            value={currentHotelId ?? ''}
            disabled={isSwitchingHotel}
            onChange={(e) => {
              void switchHotel(e.target.value)
            }}
            className="hidden sm:block text-sm rounded-lg border px-2 py-1.5 max-w-[200px] truncate disabled:opacity-60 disabled:cursor-wait"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
            }}
            aria-label="Hotel activo"
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        ) : (
          <span
            className="hidden sm:block text-sm truncate max-w-[180px]"
            style={{ color: 'var(--text-muted)' }}
            title={hotels.find((h) => h.id === currentHotelId)?.name}
          >
            {hotels.find((h) => h.id === currentHotelId)?.name ?? hotels[0]?.name}
          </span>
        )
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Notificaciones"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: '#DC2626' }}
                aria-label={`${unreadCount} sin leer`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Cambiar tema"
          style={{ color: 'var(--text-secondary)' }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User info + menu */}
        <div ref={userMenuRef} className="relative pl-2 border-l" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-label="Abrir menú de usuario"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {user?.roles[0]}
              </p>
            </div>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl border z-50 overflow-hidden"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              {settingsPath.startsWith('/settings') && (
                <button
                  role="menuitem"
                  onClick={() => { setUserMenuOpen(false); navigate(settingsPath) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <SettingsIcon size={15} style={{ color: 'var(--text-muted)' }} />
                  Configuración
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => { setUserMenuOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                style={{ color: '#DC2626' }}
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
