import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  readonly open: boolean
  readonly title: string
  readonly message: React.ReactNode
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly variant?: 'danger' | 'primary'
  readonly loading?: boolean
  readonly onConfirm: () => void
  readonly onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant      = 'danger',
  loading      = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger'

  return (
    <Modal open={open} onClose={onClose} size="sm" ariaLabel={title}>
      <div className="px-5 pt-5 pb-2 flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: isDanger ? '#FEE2E2' : 'var(--color-primary-light)',
            color:      isDanger ? '#DC2626' : 'var(--color-primary)',
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1 pt-0.5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-4 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            borderColor: 'var(--border-default)',
            color:       'var(--text-secondary)',
            background:  'transparent',
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: isDanger ? '#DC2626' : 'var(--color-primary)',
          }}
        >
          {loading ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
