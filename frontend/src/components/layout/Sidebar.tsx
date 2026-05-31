import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BedDouble,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  ClipboardList,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',    icon: LayoutDashboard, permission: null },
  { to: '/rooms',         label: 'Habitaciones', icon: BedDouble,       permission: 'view_rooms' },
  { to: '/stays',         label: 'Estadías',     icon: ClipboardList,   permission: 'view_stays' },
  { to: '/guests',        label: 'Huéspedes',    icon: Users,           permission: 'view_guests' },
  { to: '/reservations',  label: 'Reservas',     icon: CalendarDays,    permission: 'view_reservations' },
  { to: '/reports',       label: 'Reportes',     icon: BarChart3,       permission: 'view_reports' },
  { to: '/settings',      label: 'Configuración',icon: Settings,        permission: 'manage_settings' },
]

interface SidebarProps {
  collapsed?: boolean
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { logout, hasPermission } = useAuth()

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <BedDouble size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-white truncate">Hotel Manager</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, permission }) => {
            if (permission && !hasPermission(permission)) return null
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      'hover:bg-white/10',
                      isActive && 'bg-blue-600 text-white',
                      !isActive && 'text-slate-300',
                    )
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full',
            'text-slate-400 hover:text-white hover:bg-white/10 transition-colors',
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
