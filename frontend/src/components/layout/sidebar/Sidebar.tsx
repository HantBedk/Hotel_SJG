import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import { NAV_MODULES, filterVisibleModules, getModuleIdForPath } from './navigation'
import SidebarHeader from './SidebarHeader'
import SidebarNavGroup from './SidebarNavGroup'
import SidebarFooter from './SidebarFooter'

interface SidebarProps {
  readonly collapsed?: boolean
  readonly onClose?: () => void
}

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const { hasAnyPermission } = useAuth()

  const visibleModules = useMemo(
    () => filterVisibleModules(NAV_MODULES, hasAnyPermission),
    [hasAnyPermission],
  )

  const activeModuleId = useMemo(
    () => getModuleIdForPath(pathname, visibleModules),
    [pathname, visibleModules],
  )

  const [expandedModuleId, setExpandedModuleId] = useState<string | undefined>(activeModuleId)

  useEffect(() => {
    if (activeModuleId) setExpandedModuleId(activeModuleId)
  }, [activeModuleId])

  const handleToggleModule = (moduleId: string) => {
    setExpandedModuleId((current) => (current === moduleId ? undefined : moduleId))
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
      aria-label="Navegación principal"
    >
      <SidebarHeader collapsed={collapsed} onClose={onClose} />

      <nav className="flex-1 py-3 overflow-y-auto min-h-0" aria-label="Menú principal">
        <ul className="px-2 space-y-0">
          {visibleModules.map((module, index) => (
            <SidebarNavGroup
              key={module.id}
              module={module}
              collapsed={collapsed}
              isFirst={index === 0}
              pathname={pathname}
              expanded={!collapsed && expandedModuleId === module.id}
              onToggle={() => handleToggleModule(module.id)}
            />
          ))}
        </ul>
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}
