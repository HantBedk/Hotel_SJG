import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { NavItem } from '@/components/layout/sidebar/navigation'
import { useAuthStore } from '@/store/authStore'

interface RequireNavAccessProps {
  readonly item: NavItem
  readonly children: ReactNode
}

export function RequireNavAccess({ item, children }: RequireNavAccessProps) {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)

  if (item.roles?.length && !hasAnyRole(item.roles)) {
    return <Navigate to="/" replace />
  }
  if (item.permissions.length > 0 && !hasAnyPermission(item.permissions)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

interface RequireAuthProps {
  readonly children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

interface RequireGuestProps {
  readonly children: ReactNode
}

export function RequireGuest({ children }: RequireGuestProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

interface RequirePermissionProps {
  readonly children: ReactNode
  readonly permission: string | readonly string[]
}

export function RequirePermission({ children, permission }: RequirePermissionProps) {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)
  const permissions = Array.isArray(permission) ? permission : [permission]
  if (!hasAnyPermission(permissions)) return <Navigate to="/" replace />
  return <>{children}</>
}
