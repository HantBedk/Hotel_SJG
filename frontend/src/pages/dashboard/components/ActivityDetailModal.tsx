import { useMemo } from 'react'
import { Activity, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ActivityLogEntry } from '@/types'
import { ACTION_LABELS } from '../constants/activityLogLabels'
import { buildActivityDetailRows, formatUserRole } from '../utils/activityLogFormat'
import { useDialogLifecycle } from '../hooks/useDialogLifecycle'

interface ActivityDetailModalProps {
  readonly log: ActivityLogEntry
  readonly onClose: () => void
}

export default function ActivityDetailModal({ log, onClose }: ActivityDetailModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)
  const label = ACTION_LABELS[log.action] ?? log.action_label ?? log.action
  const roleLabel = formatUserRole(log.user_role)

  const payloadEntries = useMemo(() => buildActivityDetailRows(log), [log])

  const actionColor = useMemo(() => {
    if (/cancelled|failed/i.test(log.action)) return '#EF4444'
    if (/checkin|payment(?!.*cancel)|created/i.test(log.action)) return 'var(--color-primary)'
    if (/checkout/i.test(log.action)) return '#F59E0B'
    if (/transfer|extend/i.test(log.action)) return '#8B5CF6'
    if (/cleaning|maintenance/i.test(log.action)) return '#3B82F6'
    return 'var(--text-secondary)'
  }, [log.action])

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: actionColor + '18' }}
            >
              <Activity size={15} style={{ color: actionColor }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {label}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:opacity-70 shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                Usuario
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {log.user_name}
              </p>
              {roleLabel && (
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {roleLabel}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                Fecha y hora
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {new Date(log.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(log.created_at).toLocaleTimeString('es-CO', { timeStyle: 'medium' })}
              </p>
            </div>
          </div>

          {payloadEntries.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Detalles
              </p>
              <div
                className="rounded-xl divide-y overflow-hidden"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
              >
                {payloadEntries.map(({ key, label: fieldLabel, value }) => (
                  <div
                    key={key}
                    className="flex flex-col gap-0.5 px-3.5 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {fieldLabel}
                    </span>
                    <span
                      className="text-xs font-medium break-words sm:text-right sm:max-w-[65%]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--bg-input)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No hay detalles adicionales para esta actividad.
              </p>
            </div>
          )}
        </div>

        <div
          className="px-5 py-3 border-t flex justify-end"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  )
}
