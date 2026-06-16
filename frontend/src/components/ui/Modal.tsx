import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title?: string
  readonly ariaLabel?: string
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
  readonly children: ReactNode
  readonly className?: string
  readonly closeOnBackdrop?: boolean
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
  const ref = useFocusTrap<HTMLDialogElement>(open)
  const closingFromProp = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      closingFromProp.current = true
      dialog.close()
      closingFromProp.current = false
    }
  }, [open, ref])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    const handleClose = () => {
      if (!closingFromProp.current) onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('close', handleClose)
    }
  }, [onClose, ref])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={ariaLabel || title}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-end sm:items-center justify-center',
      )}
    >
      {closeOnBackdrop && (
        <button
          type="button"
          aria-label="Cerrar modal"
          className="absolute inset-0 z-0 border-0 p-0 cursor-default bg-transparent"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'relative z-10 w-full rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col',
          SIZE[size],
          className,
        )}
        style={{ background: 'var(--bg-surface)' }}
      >
        {title && (
          <h2 className="text-lg font-semibold px-5 pt-5 pb-1" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </dialog>
  )
}
