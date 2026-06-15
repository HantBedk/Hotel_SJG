import { cn } from '@/lib/cn'

interface HotelSwitchOverlayProps {
  readonly show: boolean
  readonly hotelName?: string
}

export default function HotelSwitchOverlay({ show, hotelName }: HotelSwitchOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center',
        'bg-[var(--bg-base)]/75 backdrop-blur-[2px]',
        'transition-opacity duration-300 ease-out',
        show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
      aria-hidden={!show}
      aria-live="polite"
    >
      <div
        className={cn(
          'flex flex-col items-center gap-3 px-6 py-5 rounded-2xl shadow-lg border',
          'transition-all duration-300 ease-out',
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        )}
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div
          className="w-9 h-9 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Cambiando a {hotelName ?? 'hotel'}…
        </p>
      </div>
    </div>
  )
}
