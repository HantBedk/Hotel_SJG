import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultSettingsPath } from '@/components/layout/sidebar/navigation'

export default function SettingsIndexRedirect() {
  const { hasAnyPermission } = useAuth()
  return <Navigate to={getDefaultSettingsPath(hasAnyPermission)} replace />
}
