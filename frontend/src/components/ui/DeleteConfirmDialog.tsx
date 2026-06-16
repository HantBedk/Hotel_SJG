import type { ReactNode } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export interface DeleteConfirmDialogProps<T> {
  readonly target: T | null
  readonly title?: string
  readonly message: ReactNode
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly loading?: boolean
  readonly onConfirm: (target: T) => void
  readonly onClose: () => void
}

export function DeleteConfirmDialog<T>({
  target,
  title = 'Eliminar registro',
  message,
  confirmLabel = 'Sí, eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onClose,
}: DeleteConfirmDialogProps<T>) {
  return (
    <ConfirmDialog
      open={target != null}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant="danger"
      loading={loading}
      onConfirm={() => {
        if (target != null) onConfirm(target)
      }}
      onClose={onClose}
    />
  )
}
