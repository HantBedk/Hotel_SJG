import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuthBootstrap } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const DashboardPage   = lazy(() => import('@/pages/dashboard/DashboardPage'))
const GuestsPage      = lazy(() => import('@/pages/guests/GuestsPage'))
const RoomsPage       = lazy(() => import('@/pages/rooms/RoomsPage'))
const StaysPage       = lazy(() => import('@/pages/stays/StaysPage'))
const CompaniesPage   = lazy(() => import('@/pages/companies/CompaniesPage'))
const SettingsPage    = lazy(() => import('@/pages/settings/SettingsPage'))
const ReservationsPage= lazy(() => import('@/pages/reservations/ReservationsPage'))
const CalendarPage    = lazy(() => import('@/pages/calendar/CalendarPage'))
const InventoryPage   = lazy(() => import('@/pages/inventory/InventoryPage'))
const ActivityPage    = lazy(() => import('@/pages/activity/ActivityPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ── Bootstrap gate ────────────────────────────────────────────────────────────
function BootstrapGate() {
  const { isBootstrapping } = useAuthBootstrap()
  if (isBootstrapping) return <PageLoader />
  return <Outlet />
}

// ── Route guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequirePermission({
  children,
  permission,
}: {
  children: React.ReactNode
  permission: string
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission(permission)) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    element: <BootstrapGate />,
    children: [
      {
        path: '/login',
        element: (
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        ),
      },
      {
        path: '/',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: <Lazy><DashboardPage /></Lazy>,
          },
          {
            path: 'rooms',
            element: (
              <RequirePermission permission="view_rooms">
                <Lazy><RoomsPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'guests',
            element: (
              <RequirePermission permission="check_in">
                <Lazy><GuestsPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'companies',
            element: (
              <RequirePermission permission="check_in">
                <Lazy><CompaniesPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'stays',
            element: (
              <RequirePermission permission="check_in">
                <Lazy><StaysPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'reservations',
            element: (
              <RequirePermission permission="view_reservations">
                <Lazy><ReservationsPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'calendar',
            element: (
              <RequirePermission permission="view_reservations">
                <Lazy><CalendarPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'inventory',
            element: (
              <RequirePermission permission="view_inventory">
                <Lazy><InventoryPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'activity',
            element: (
              <RequirePermission permission="view_activity_log">
                <Lazy><ActivityPage /></Lazy>
              </RequirePermission>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequirePermission permission="view_settings">
                <Lazy><SettingsPage /></Lazy>
              </RequirePermission>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
