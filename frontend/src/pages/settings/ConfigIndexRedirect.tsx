import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultConfigPath } from '@/components/layout/sidebar/navigation'

export default function ConfigIndexRedirect() {
  const { hasAnyPermission } = useAuth()
  return <Navigate to={getDefaultConfigPath(hasAnyPermission)} replace />
}
