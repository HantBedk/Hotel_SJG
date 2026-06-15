import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import SidebarNavLink from './SidebarNavLink'
import { matchesNavItemPath, type NavModule } from './navigation'

interface SidebarNavGroupProps {
  readonly module: NavModule
  readonly collapsed: boolean
  readonly isFirst: boolean
  readonly pathname: string
  readonly expanded: boolean
  readonly onToggle: () => void
}

export default function SidebarNavGroup({
  module,
  collapsed,
  isFirst,
  pathname,
  expanded,
  onToggle,
}: SidebarNavGroupProps) {
  const hasActiveItem = module.items.some((item) => matchesNavItemPath(pathname, item))

  if (collapsed) {
    return (
      <li
        className={cn(
          !isFirst && 'pt-2 mt-2 border-t border-white/10',
        )}
      >
        <ul className="space-y-1">
          {module.items.map((item) => (
            <li key={item.id}>
              <SidebarNavLink item={item} collapsed />
            </li>
          ))}
        </ul>
      </li>
    )
  }

  return (
    <li
      className={cn(
        !isFirst && 'pt-1 mt-1',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`nav-module-items-${module.id}`}
        className={cn(
          'flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors',
          'hover:bg-white/5',
          hasActiveItem ? 'text-slate-200' : 'text-slate-500',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
            {module.label}
          </span>
          {hasActiveItem && !expanded && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
          )}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-slate-500 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={`nav-module-items-${module.id}`}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <ul className="overflow-hidden space-y-0.5 pt-0.5 pb-1">
          {module.items.map((item) => (
            <li key={item.id}>
              <SidebarNavLink item={item} collapsed={false} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
