import { X } from 'lucide-react'
import SidebarHotelBrand from '../SidebarHotelBrand'

interface SidebarHeaderProps {
  readonly collapsed: boolean
  readonly onClose?: () => void
}

export default function SidebarHeader({ collapsed, onClose }: SidebarHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 min-w-0 shrink-0">
      <SidebarHotelBrand collapsed={collapsed} />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
