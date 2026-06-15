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
  ShoppingCart,
  DollarSign,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import SidebarHotelBrand from './SidebarHotelBrand'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',     icon: LayoutDashboard, permission: ['view_dashboard'] as const },
  { to: '/rooms',        label: 'Habitaciones',  icon: BedDouble,       permission: ['view_rooms'] as const },
  { to: '/stays',        label: 'Estadías',      icon: ClipboardList,   permission: ['check_in'] as const },
  { to: '/guests',       label: 'Huéspedes',     icon: Users,           permission: ['check_in'] as const },
  { to: '/companies',    label: 'Empresas',      icon: Building2,       permission: ['check_in'] as const },
  { to: '/reservations', label: 'Reservas',      icon: CalendarDays,    permission: ['view_reservations', 'manage_reservations'] as const },
  { to: '/calendar',     label: 'Calendario',    icon: CalendarRange,   permission: ['view_reservations', 'manage_reservations'] as const },
  { to: '/inventory',    label: 'Inventario',    icon: Package,         permission: ['view_inventory', 'manage_inventory'] as const },
  { to: '/minibar-sales', label: 'Venta productos', icon: ShoppingCart,    permission: ['check_in'] as const },
  { to: '/income',       label: 'Ingresos',      icon: DollarSign,      permission: ['view_reports'] as const },
  { to: '/activity',     label: 'Historial',     icon: BarChart3,       permission: ['view_activity_log'] as const },
  { to: '/settings',     label: 'Configuración', icon: Settings,        permission: ['view_settings', 'manage_settings'] as const },
] as const

interface SidebarProps {
  readonly collapsed?: boolean
  readonly onClose?: () => void
}

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const { logout, hasAnyPermission } = useAuth()

  const visibleNavItems = NAV_ITEMS.filter((item) => hasAnyPermission(item.permission))

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 min-w-0">
        <SidebarHotelBrand collapsed={collapsed} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Menú principal">
        <ul className="space-y-1 px-2">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
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
          ))}
        </ul>
      </nav>

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
            type="button"
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
