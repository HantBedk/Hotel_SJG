import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import GuestsPage from '@/pages/guests/GuestsPage'
import RoomsPage from '@/pages/rooms/RoomsPage'
import StaysPage from '@/pages/stays/StaysPage'
import CompaniesPage from '@/pages/companies/CompaniesPage'
import SettingsPage from '@/pages/settings/SettingsPage'

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
      { index: true, element: <DashboardPage /> },
      {
        path: 'rooms',
        element: (
          <RequirePermission permission="view_rooms">
            <RoomsPage />
          </RequirePermission>
        ),
      },
      {
        path: 'guests',
        element: (
          <RequirePermission permission="check_in">
            <GuestsPage />
          </RequirePermission>
        ),
      },
      {
        path: 'companies',
        element: (
          <RequirePermission permission="check_in">
            <CompaniesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'stays',
        element: (
          <RequirePermission permission="check_in">
            <StaysPage />
          </RequirePermission>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequirePermission permission="view_settings">
            <SettingsPage />
          </RequirePermission>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
