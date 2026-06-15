import { useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/cn'
import { RELATIONSHIPS } from '@/pages/checkin/constants'
import { useCheckInWizard } from '@/pages/checkin/hooks/useCheckInWizard'
import { CheckInStepRouter } from '@/pages/checkin/components/CheckInStepRouter'
import type { CheckInWizardProps } from '@/pages/checkin/types'

export default function CheckInWizard({ rooms, onClose }: CheckInWizardProps) {
  const wizard = useCheckInWizard(rooms, onClose)
  const {
    steps,
    currentStep,
    currentIdx,
    isFirst,
    isLast,
    isSaving,
    isCheckingIn,
    canGoNext,
    confirmValid,
    navigation,
  } = wizard

  const dialogRef = useFocusTrap<HTMLDialogElement>(true, isFirst ? onClose : undefined)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Check-in habitaciones ${rooms.map((r) => r.number).join(', ')}`}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-end sm:items-center justify-center pointer-events-none',
      )}
    >
      <datalist id="relationship-suggestions">
        {RELATIONSHIPS.map((r) => <option key={r} value={r} />)}
      </datalist>

      {isFirst ? (
        <button
          type="button"
          aria-label="Cerrar modal"
          className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
          onClick={onClose}
        />
      ) : (
        <div className={cn(backdropClassName, 'pointer-events-none')} aria-hidden="true" />
      )}

      <div
        className="relative z-10 pointer-events-auto w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <header
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Check-in — {rooms.map((r) => `Hab. ${r.number}`).join(', ')}
            </h2>
            <div className="flex gap-1 mt-2">
              {steps.map((s, i) => (
                <span
                  key={s}
                  className="h-1.5 rounded-full transition-all duration-200"
                  style={{
                    width: s === currentStep ? '18px' : '6px',
                    background: i <= currentIdx ? 'var(--color-primary)' : 'var(--border-default)',
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
            style={{ background: 'var(--bg-input)' }}
            aria-label="Cerrar"
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <CheckInStepRouter wizard={wizard} rooms={rooms} />
        </div>

        <footer
          className="flex items-center justify-between px-5 py-4 border-t gap-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {isFirst ? (
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={navigation.navigatePrev}
              className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              disabled={!confirmValid || isCheckingIn}
              onClick={navigation.handleConfirm}
              className={cn(
                'flex items-center gap-2 text-sm px-5 py-2 rounded-lg font-medium transition-opacity',
                (!confirmValid || isCheckingIn) && 'opacity-40 cursor-not-allowed',
              )}
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <CheckCircle size={16} />
              {isCheckingIn ? 'Procesando…' : 'Confirmar Check-in'}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canGoNext || isSaving}
              onClick={navigation.navigateNext}
              className={cn(
                'flex items-center gap-1 text-sm px-5 py-2 rounded-lg font-medium transition-opacity',
                (!canGoNext || isSaving) && 'opacity-40 cursor-not-allowed',
              )}
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {isSaving ? 'Guardando…' : <>Siguiente <ChevronRight size={16} /></>}
            </button>
          )}
        </footer>
      </div>
    </dialog>
  )
}
