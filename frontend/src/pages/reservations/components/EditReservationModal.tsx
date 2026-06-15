import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/cn'
import type { Reservation } from '@/types'

interface Props {
  readonly reservation: Reservation
  readonly onSave: (payload: {
    id: string
    start_date?: string
    end_date?: string
    agreed_price?: number
    deposit_amount?: number
    notes?: string
  }) => void
  readonly onClose: () => void
  readonly saving?: boolean
}

function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0
  const d1 = new Date(start)
  const d2 = new Date(end)
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86_400_000))
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

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

  return { dialogRef, backdropClassName }
}

function nightPluralSuffix(n: number): string {
  return n === 1 ? '' : 's'
}

function nightsSummaryText(nights: number): string {
  if (nights <= 0) return 'Las fechas no son válidas'
  return `${nights} noche${nightPluralSuffix(nights)}`
}

export default function EditReservationModal({ reservation, onSave, onClose, saving }: Props) {
  const initialStart = toDateInputValue(reservation.start_date)
  const initialEnd   = toDateInputValue(reservation.end_date)

  const [startDate, setStartDate]     = useState(initialStart)
  const [endDate, setEndDate]         = useState(initialEnd)
  const [agreedPrice, setAgreedPrice] = useState(String(reservation.agreed_price ?? ''))
  const [deposit, setDeposit]         = useState(String(reservation.deposit_amount ?? ''))
  const [notes, setNotes]             = useState(reservation.notes ?? '')

  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  const nights = nightsBetween(startDate, endDate)
  const priceNum = Number(agreedPrice)
  const valid = startDate && endDate && nights > 0 && agreedPrice && priceNum >= 0
  const nightsSummary = nightsSummaryText(nights)

  const handleSave = () => {
    if (!valid) return
    const payload: Parameters<Props['onSave']>[0] = { id: reservation.id }
    if (startDate !== initialStart) payload.start_date = startDate
    if (endDate   !== initialEnd)   payload.end_date   = endDate
    if (priceNum  !== Number(reservation.agreed_price)) payload.agreed_price = priceNum
    if (deposit && Number(deposit) !== Number(reservation.deposit_amount ?? 0)) payload.deposit_amount = Number(deposit)
    if ((notes || null) !== (reservation.notes ?? null)) payload.notes = notes || undefined
    onSave(payload)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Editar reserva"
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Editar Reserva</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {reservation.guest?.full_name ?? reservation.company?.name ?? '—'}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div
            className="rounded-lg p-3 text-xs space-y-1"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
          >
            <p>
              <strong>Huésped:</strong> {reservation.guest?.full_name ?? '—'}
              {reservation.guest?.document_number && ` (${reservation.guest.document_number})`}
            </p>
            {reservation.company && (
              <p><strong>Empresa:</strong> {reservation.company.name}</p>
            )}
            <p className="opacity-75">
              Para cambiar huésped/empresa/habitación, cancela la reserva y crea una nueva.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-res-start-date" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Llegada *
              </label>
              <input
                id="edit-res-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label htmlFor="edit-res-end-date" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Salida *
              </label>
              <input
                id="edit-res-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <p className="text-xs" style={{ color: nights > 0 ? 'var(--text-muted)' : '#DC2626' }}>
            {nightsSummary}
          </p>

          <div>
            <label htmlFor="edit-res-agreed-price" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Precio total acordado (COP) *
            </label>
            <input
              id="edit-res-agreed-price"
              type="number"
              min="0"
              step="any"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label htmlFor="edit-res-deposit" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Depósito previsto (COP)
            </label>
            <input
              id="edit-res-deposit"
              type="number"
              min="0"
              step="any"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label htmlFor="edit-res-notes" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Notas
            </label>
            <textarea
              id="edit-res-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div
          className="flex gap-2 px-5 py-4 border-t shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar cambios
          </button>
        </div>
      </div>
    </dialog>
  )
}
