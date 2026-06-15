import { useLocation } from 'react-router-dom'
import ConfiguracionForm, { type SettingsConfigGroup } from './tabs/ConfiguracionTab'

const GROUP_BY_PATH: Record<string, SettingsConfigGroup> = {
  '/settings/config/hotel': 'hotel',
  '/settings/config/inventory': 'inventory',
  '/settings/config/system': 'system',
}

export default function ConfiguracionGroupPage() {
  const { pathname } = useLocation()
  const group = GROUP_BY_PATH[pathname] ?? 'hotel'
  return <ConfiguracionForm group={group} />
}
