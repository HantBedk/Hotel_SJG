import type { ElementType } from 'react'
import {
  LayoutDashboard,
  BedDouble,
  Users,
  Building2,
  CalendarDays,
  CalendarRange,
  BarChart3,
  ClipboardList,
  Package,
  ShoppingCart,
  DollarSign,
  Hotel,
  Layers,
  Calendar,
  Shield,
  Database,
  Sparkles,
  SlidersHorizontal,
  Network,
  Contact,
} from 'lucide-react'

export interface NavItem {
  readonly id: string
  readonly to: string
  readonly label: string
  readonly pageTitle: string
  readonly icon: ElementType
  readonly permissions: readonly string[]
  /** Si se define, el usuario debe tener al menos uno de estos roles. */
  readonly roles?: readonly string[]
  readonly end?: boolean
}

export interface NavModule {
  readonly id: string
  readonly label: string
  readonly items: readonly NavItem[]
  /** Si es false, los ítems se muestran siempre visibles (sin acordeón). */
  readonly collapsible?: boolean
}

/** Módulos de administración (/settings/*), en orden de prioridad para redirects. */
const SETTINGS_MODULE_IDS = ['property', 'parameters', 'platform'] as const

export const NAV_MODULES: readonly NavModule[] = [
  {
    id: 'overview',
    label: 'Inicio',
    collapsible: false,
    items: [
      {
        id: 'dashboard',
        to: '/',
        label: 'Dashboard',
        pageTitle: 'Dashboard',
        icon: LayoutDashboard,
        permissions: ['view_dashboard'],
        end: true,
      },
    ],
  },
  {
    id: 'front-desk',
    label: 'Recepción',
    collapsible: false,
    items: [
      {
        id: 'rooms',
        to: '/rooms',
        label: 'Plano de habitaciones',
        pageTitle: 'Plano de habitaciones',
        icon: BedDouble,
        permissions: ['view_rooms'],
      },
      {
        id: 'stays',
        to: '/stays',
        label: 'Estadías',
        pageTitle: 'Estadías',
        icon: ClipboardList,
        permissions: ['check_in'],
      },
      {
        id: 'guests',
        to: '/guests',
        label: 'Huéspedes',
        pageTitle: 'Huéspedes',
        icon: Users,
        permissions: ['check_in'],
      },
      {
        id: 'companies',
        to: '/companies',
        label: 'Empresas',
        pageTitle: 'Empresas',
        icon: Building2,
        permissions: ['check_in'],
      },
      {
        id: 'reservations-list',
        to: '/reservations',
        label: 'Reservas',
        pageTitle: 'Reservaciones',
        icon: CalendarDays,
        permissions: ['view_reservations', 'manage_reservations'],
      },
      {
        id: 'calendar',
        to: '/calendar',
        label: 'Calendario',
        pageTitle: 'Calendario',
        icon: CalendarRange,
        permissions: ['view_reservations', 'manage_reservations'],
      },
      {
        id: 'minibar-sales',
        to: '/minibar-sales',
        label: 'Venta productos',
        pageTitle: 'Venta productos',
        icon: ShoppingCart,
        permissions: ['check_in'],
      },
      {
        id: 'income',
        to: '/income',
        label: 'Ingresos',
        pageTitle: 'Ingresos',
        icon: DollarSign,
        permissions: ['view_reports'],
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    items: [
      {
        id: 'inventory',
        to: '/inventory',
        label: 'Inventario',
        pageTitle: 'Inventario',
        icon: Package,
        permissions: ['view_inventory', 'manage_inventory'],
      },
    ],
  },
  {
    id: 'audit',
    label: 'Auditoría',
    items: [
      {
        id: 'activity',
        to: '/activity',
        label: 'Registro de actividad',
        pageTitle: 'Registro de actividad',
        icon: BarChart3,
        permissions: ['view_activity_log'],
      },
    ],
  },
  {
    id: 'property',
    label: 'Propiedad',
    items: [
      {
        id: 'settings-hotels',
        to: '/settings/hotels',
        label: 'Red de hoteles',
        pageTitle: 'Red de hoteles',
        icon: Network,
        permissions: ['view_hotels'],
        end: true,
      },
      {
        id: 'settings-hotel',
        to: '/settings/hotel',
        label: 'Datos del hotel',
        pageTitle: 'Datos del hotel',
        icon: Hotel,
        permissions: ['manage_settings'],
        end: true,
      },
      {
        id: 'settings-houses',
        to: '/settings/houses',
        label: 'Tipos de habitación',
        pageTitle: 'Tipos de habitación',
        icon: Layers,
        permissions: ['manage_settings'],
        end: true,
      },
      {
        id: 'settings-rooms',
        to: '/settings/rooms',
        label: 'Catálogo de habitaciones',
        pageTitle: 'Catálogo de habitaciones',
        icon: BedDouble,
        permissions: ['manage_settings'],
        end: true,
      },
      {
        id: 'settings-seasons',
        to: '/settings/seasons',
        label: 'Temporadas',
        pageTitle: 'Temporadas',
        icon: Calendar,
        permissions: ['manage_settings'],
        end: true,
      },
      {
        id: 'settings-services',
        to: '/settings/services',
        label: 'Servicios adicionales',
        pageTitle: 'Servicios adicionales',
        icon: Sparkles,
        permissions: ['manage_settings'],
        end: true,
      },
    ],
  },
  {
    id: 'parameters',
    label: 'Parámetros',
    items: [
      {
        id: 'settings-config',
        to: '/settings/config',
        label: 'Parámetros generales',
        pageTitle: 'Parámetros generales',
        icon: SlidersHorizontal,
        permissions: ['manage_settings'],
        end: true,
      },
    ],
  },
  {
    id: 'platform',
    label: 'Plataforma',
    items: [
      {
        id: 'settings-users',
        to: '/settings/users',
        label: 'Usuarios',
        pageTitle: 'Usuarios',
        icon: Users,
        permissions: ['manage_users'],
        end: true,
      },
      {
        id: 'settings-personas',
        to: '/settings/personas',
        label: 'Personas',
        pageTitle: 'Directorio de personas',
        icon: Contact,
        permissions: [],
        roles: ['admin', 'superadmin'],
        end: true,
      },
      {
        id: 'settings-permissions',
        to: '/settings/permissions',
        label: 'Roles y permisos',
        pageTitle: 'Roles y permisos',
        icon: Shield,
        permissions: ['manage_roles'],
        end: true,
      },
      {
        id: 'settings-backups',
        to: '/settings/backups',
        label: 'Backups',
        pageTitle: 'Backups',
        icon: Database,
        permissions: ['trigger_backup'],
        end: true,
      },
    ],
  },
] as const

export const NAV_ITEMS: readonly NavItem[] = NAV_MODULES.flatMap((module) => module.items)

/** Unión de todos los `id` definidos en el menú (debe coincidir con APP_ROUTE_COMPONENTS). */
export type NavItemId = (typeof NAV_MODULES)[number]['items'][number]['id']

export function matchesNavItemPath(pathname: string, item: NavItem): boolean {
  const exact = item.end ?? item.to === '/'
  if (exact) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function getModuleIdForPath(
  pathname: string,
  modules: readonly NavModule[],
): string | undefined {
  for (const module of modules) {
    if (module.items.some((item) => matchesNavItemPath(pathname, item))) {
      return module.id
    }
  }
  return undefined
}

export function getNavItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => matchesNavItemPath(pathname, item))
}

/** Segmento de ruta React Router (`null` = index `/`). */
export function navItemRouteSegment(item: NavItem): string | null {
  if (item.to === '/') return null
  return item.to.slice(1)
}

export function filterVisibleModules(
  modules: readonly NavModule[],
  hasAnyPermission: (permissions: readonly string[]) => boolean,
  hasAnyRole: (roles: readonly string[]) => boolean = () => false,
): NavModule[] {
  return modules
    .map((module) => ({
      ...module,
      items: module.items.filter((item) => {
        if (item.roles?.length && !hasAnyRole(item.roles)) return false
        if (item.permissions.length === 0) return true
        return hasAnyPermission(item.permissions)
      }),
    }))
    .filter((module) => module.items.length > 0)
}

const PAGE_TITLE_BY_PATH = new Map(
  NAV_MODULES.flatMap((module) => module.items.map((item) => [item.to, item.pageTitle] as const)),
)

function firstAccessibleItemInModules(
  moduleIds: readonly string[],
  hasAnyPermission: (permissions: readonly string[]) => boolean,
): NavItem | undefined {
  for (const moduleId of moduleIds) {
    const module = NAV_MODULES.find((entry) => entry.id === moduleId)
    const item = module?.items.find((entry) => hasAnyPermission(entry.permissions))
    if (item) return item
  }
  return undefined
}

export function getDefaultConfigPath(
  hasAnyPermission: (permissions: readonly string[]) => boolean,
): string {
  const first = firstAccessibleItemInModules(['parameters'], hasAnyPermission)
  return first?.to ?? getDefaultSettingsPath(hasAnyPermission)
}

export function getDefaultSettingsPath(
  hasAnyPermission: (permissions: readonly string[]) => boolean,
): string {
  const first = firstAccessibleItemInModules(SETTINGS_MODULE_IDS, hasAnyPermission)
  return first?.to ?? '/'
}

export function getPageTitle(pathname: string): string {
  return PAGE_TITLE_BY_PATH.get(pathname) ?? 'Hotel Manager'
}
