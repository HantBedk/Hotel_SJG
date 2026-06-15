import { LogOut } from 'lucide-react'

interface StayDrawerFooterProps {
  readonly onCheckOut: () => void
}

export function StayDrawerFooter({ onCheckOut }: StayDrawerFooterProps) {
  return (
    <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
      <button
        type="button"
        onClick={onCheckOut}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        style={{ background: 'var(--status-occupied)', color: '#fff' }}
      >
        <LogOut size={16} />
        Iniciar Checkout
      </button>
    </div>
  )
}
