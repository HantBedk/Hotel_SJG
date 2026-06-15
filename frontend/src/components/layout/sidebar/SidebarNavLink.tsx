import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { NavItem } from './navigation'

interface SidebarNavLinkProps {
  readonly item: NavItem
  readonly collapsed: boolean
}

export default function SidebarNavLink({ item, collapsed }: SidebarNavLinkProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end ?? item.to === '/'}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
          'hover:bg-white/10',
          collapsed && 'justify-center',
          isActive ? 'bg-blue-600 text-white' : 'text-slate-300',
        )
      }
    >
      <Icon size={18} className="flex-shrink-0" aria-hidden="true" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}
