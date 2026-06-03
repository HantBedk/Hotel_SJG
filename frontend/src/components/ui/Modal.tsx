import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  className?: string
  closeOnBackdrop?: boolean
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  size = 'md',
  children,
  className,
  closeOnBackdrop = true,
}: ModalProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={closeOnBackdrop ? onClose : undefined}
      aria-hidden="false"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        className={cn(
          'w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col',
          SIZE[size],
          className,
        )}
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-lg font-semibold px-5 pt-5" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
