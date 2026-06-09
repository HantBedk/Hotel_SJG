import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BedDouble,
  Users,
  Building2,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Settings,
  ClipboardList,
  Package,
  DollarSign,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import { useHotelInfo } from '@/hooks/useAdmin'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',     icon: LayoutDashboard, permission: 'view_dashboard' },
  { to: '/rooms',        label: 'Habitaciones',  icon: BedDouble,       permission: 'view_rooms' },
  { to: '/stays',        label: 'Estadías',      icon: ClipboardList,   permission: 'check_in' },
  { to: '/guests',       label: 'Huéspedes',     icon: Users,           permission: 'check_in' },
  { to: '/companies',    label: 'Empresas',      icon: Building2,       permission: 'check_in' },
  { to: '/reservations', label: 'Reservas',      icon: CalendarDays,    permission: 'view_reservations' },
  { to: '/calendar',     label: 'Calendario',    icon: CalendarRange,   permission: 'view_reservations' },
  { to: '/inventory',    label: 'Inventario',    icon: Package,         permission: 'view_inventory' },
  { to: '/income',       label: 'Ingresos',      icon: DollarSign,      permission: 'view_reports' },
  { to: '/activity',     label: 'Historial',     icon: BarChart3,       permission: 'view_activity_log' },
  { to: '/settings',     label: 'Configuración', icon: Settings,        permission: 'view_settings' },
]

interface SidebarProps {
  collapsed?: boolean
  onClose?: () => void
}

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const { logout, hasPermission } = useAuth()
  const { data: hotel }           = useHotelInfo()

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
      aria-label="Navegación principal"
    >
      {/* Logo + mobile close button */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: 'var(--color-primary)' }}
          aria-hidden="true"
        >
          {hotel?.logo_url ? (
            <img src={hotel.logo_url} alt="" className="w-full h-full object-contain" />
          ) : (
            <BedDouble size={16} className="text-white" />
          )}
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-white truncate flex-1">
            {hotel?.name || 'Hotel Manager'}
          </span>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Menú principal">
        <ul className="space-y-1 px-2" role="list">
          {NAV_ITEMS.map(({ to, label, icon: Icon, permission }) => {
            if (!hasPermission(permission)) return null
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  aria-label={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      'hover:bg-white/10',
                      collapsed && 'justify-center',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300',
                    )
                  }
                >
                  <Icon size={18} className="flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Creator info + Logout */}
      <div className="border-t border-white/10">
        {!collapsed && (
          <p
            className="px-4 pt-3 pb-1 text-center"
            style={{ color: 'var(--text-muted)', fontSize: '10px' }}
          >
            Desarrollado por HantBedk
          </p>
        )}
        <div className="p-2">
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full',
              'text-slate-400 hover:text-white hover:bg-white/10 transition-colors',
              collapsed && 'justify-center',
            )}
          >
            <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
