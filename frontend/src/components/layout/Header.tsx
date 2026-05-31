import { Bell, Moon, Sun, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface HeaderProps {
  title: string
  onToggleSidebar?: () => void
  darkMode: boolean
  onToggleDark: () => void
}

export default function Header({ title, onToggleSidebar, darkMode, onToggleDark }: HeaderProps) {
  const user = useAuthStore((s) => s.user)

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

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Notificaciones"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell size={20} />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Cambiar tema"
          style={{ color: 'var(--text-secondary)' }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border-default)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {user?.roles[0]}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
