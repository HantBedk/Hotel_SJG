import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalFooterProps {
  readonly children: ReactNode
  readonly className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn('flex gap-3 px-5 py-4 border-t shrink-0', className)}
      style={{ borderColor: 'var(--border-default)' }}
    >
      {children}
    </div>
  )
}
