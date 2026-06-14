import { useMemo, useState } from 'react'
import { Building2, Hotel, Layers, Calendar, Package, Settings, Users, Shield, Database } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import HotelTab        from './tabs/HotelTab'
import HabitacionesTab from './tabs/HabitacionesTab'
import CasasTiposTab   from './tabs/CasasTiposTab'
import TemporadasTab   from './tabs/TemporadasTab'
import ServiciosTab    from './tabs/ServiciosTab'
import ConfiguracionTab from './tabs/ConfiguracionTab'
import UsuariosTab     from './tabs/UsuariosTab'
import PermisosTab     from './tabs/PermisosTab'
import BackupsTab      from './tabs/BackupsTab'

const ALL_TABS = [
  { key: 'hotel',       label: 'Hotel',        icon: Hotel,     permission: 'manage_settings' },
  { key: 'rooms',       label: 'Habitaciones', icon: Building2, permission: 'manage_settings' },
  { key: 'houses',      label: 'Tipos de habitación', icon: Layers,   permission: 'manage_settings' },
  { key: 'seasons',     label: 'Temporadas',   icon: Calendar,  permission: 'manage_settings' },
  { key: 'services',    label: 'Servicios',    icon: Package,   permission: 'manage_settings' },
  { key: 'config',      label: 'Configuración', icon: Settings, permission: 'manage_settings' },
  { key: 'users',       label: 'Usuarios',     icon: Users,     permission: 'manage_users' },
  { key: 'permissions', label: 'Permisos',     icon: Shield,    permission: 'manage_roles' },
  { key: 'backups',     label: 'Backups',      icon: Database,  permission: 'trigger_backup' },
] as const

type TabKey = typeof ALL_TABS[number]['key']

export default function SettingsPage() {
  const { hasPermission } = useAuth()

  const tabs = useMemo(
    () => ALL_TABS.filter(t => hasPermission(t.permission as Parameters<typeof hasPermission>[0])),
    [hasPermission],
  )

  const [active, setActive] = useState<TabKey>(() => tabs[0]?.key ?? 'config')

  const TAB_CONTENT: Record<TabKey, React.ReactNode> = {
    hotel:       <HotelTab />,
    rooms:       <HabitacionesTab />,
    houses:      <CasasTiposTab />,
    seasons:     <TemporadasTab />,
    services:    <ServiciosTab />,
    config:      <ConfiguracionTab />,
    users:       <UsuariosTab />,
    permissions: <PermisosTab />,
    backups:     <BackupsTab />,
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Sidebar de tabs */}
      <nav className="w-44 flex-shrink-0 space-y-1" aria-label="Secciones de configuración">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            aria-current={active === key ? 'page' : undefined}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: active === key ? 'var(--color-primary-light)' : 'transparent',
              color:      active === key ? 'var(--color-primary)'       : 'var(--text-secondary)',
              fontWeight: active === key ? 600 : 400,
            }}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {TAB_CONTENT[active]}
      </div>
    </div>
  )
}
