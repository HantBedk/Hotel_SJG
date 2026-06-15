import { Outlet, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthBootstrap } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import SettingsIndexRedirect from '@/pages/settings/SettingsIndexRedirect'
import ConfigIndexRedirect from '@/pages/settings/ConfigIndexRedirect'
import { buildProtectedAppRoutes } from './buildProtectedAppRoutes'
import { RequireAuth, RequireGuest } from './guards'
import { PageLoader } from './PageLoader'

function BootstrapGate() {
  const { isBootstrapping } = useAuthBootstrap()
  if (isBootstrapping) return <PageLoader />
  return <Outlet />
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
          ...buildProtectedAppRoutes(),
          { path: 'settings', element: <SettingsIndexRedirect /> },
          { path: 'settings/config', element: <ConfigIndexRedirect /> },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
