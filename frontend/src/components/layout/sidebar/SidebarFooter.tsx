import { LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'

interface SidebarFooterProps {
  readonly collapsed: boolean
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { logout } = useAuth()

  return (
    <div className="border-t border-white/10 shrink-0">
      {!collapsed && (
        <p
          className="px-4 pt-3 pb-1 text-center"
          style={{ color: 'var(--text-muted)', fontSize: '10px' }}
        >
          Desarrollado por HantBedk
        </p>
      )}
      <div className="p-2">
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full',
            'text-slate-400 hover:text-white hover:bg-white/10 transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )
}
