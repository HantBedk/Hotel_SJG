import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import type { NavItemId } from '@/components/layout/sidebar/navigation'

type AppPage = LazyExoticComponent<ComponentType>

/** Mapa nav item id → página lazy. Debe cubrir todos los ítems de navigation.ts */
export const APP_ROUTE_COMPONENTS = {
  dashboard:            lazy(() => import('@/pages/dashboard/DashboardPage')),
  rooms:                lazy(() => import('@/pages/rooms/RoomsPage')),
  stays:                lazy(() => import('@/pages/stays/StaysPage')),
  guests:               lazy(() => import('@/pages/guests/GuestsPage')),
  companies:            lazy(() => import('@/pages/companies/CompaniesPage')),
  'reservations-list':  lazy(() => import('@/pages/reservations/ReservationsPage')),
  calendar:             lazy(() => import('@/pages/calendar/CalendarPage')),
  'minibar-sales':      lazy(() => import('@/pages/minibar-sales/MinibarSalesPage')),
  inventory:            lazy(() => import('@/pages/inventory/InventoryPage')),
  income:               lazy(() => import('@/pages/income/IncomePage')),
  activity:             lazy(() => import('@/pages/activity/ActivityPage')),
  'settings-hotels':      lazy(() => import('@/pages/settings/tabs/HotelesTab')),
  'settings-hotel':       lazy(() => import('@/pages/settings/tabs/HotelTab')),
  'settings-rooms':       lazy(() => import('@/pages/settings/tabs/HabitacionesTab')),
  'settings-houses':      lazy(() => import('@/pages/settings/tabs/CasasTiposTab')),
  'settings-seasons':     lazy(() => import('@/pages/settings/tabs/TemporadasTab')),
  'settings-services':    lazy(() => import('@/pages/settings/tabs/ServiciosTab')),
  'settings-config':      lazy(() => import('@/pages/settings/ConfiguracionPage')),
  'settings-users':       lazy(() => import('@/pages/settings/tabs/UsuariosTab')),
  'settings-personas':    lazy(() => import('@/pages/settings/tabs/PersonasTab')),
  'settings-permissions': lazy(() => import('@/pages/settings/tabs/PermisosTab')),
  'settings-backups':     lazy(() => import('@/pages/settings/tabs/BackupsTab')),
} as const satisfies Record<NavItemId, AppPage>

export type AppRouteId = NavItemId
