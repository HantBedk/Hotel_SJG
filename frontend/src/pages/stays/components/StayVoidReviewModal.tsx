import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { formatDateShort } from '@/lib/formatDate'
import { formatCOP } from '@/lib/format'
import type { StayVoidRequest } from '@/types/stayVoid'

interface StayVoidReviewModalProps {
  readonly open: boolean
  readonly request: StayVoidRequest | null
  readonly onClose: () => void
  readonly onApprove: (adminNotes?: string) => Promise<unknown>
  readonly onReject: (adminNotes?: string) => Promise<unknown>
  readonly isApproving?: boolean
  readonly isRejecting?: boolean
}

export function StayVoidReviewModal({
  open, request, onClose, onApprove, onReject, isApproving, isRejecting,
}: StayVoidReviewModalProps) {
  const [adminNotes, setAdminNotes] = useState('')
  const busy = isApproving || isRejecting

  if (!request) return null

  const stay = request.stay
  const rooms = stay?.stay_rooms
    ?.map((sr) => sr.room?.number)
    .filter(Boolean)
    .join(', ')

  const handleClose = () => {
    setAdminNotes('')
    onClose()
  }

  const handleApprove = async () => {
    await onApprove(adminNotes.trim() || undefined)
    setAdminNotes('')
    onClose()
  }

  const handleReject = async () => {
    await onReject(adminNotes.trim() || undefined)
    setAdminNotes('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Revisar anulación de estadía" size="lg">
      <div className="space-y-4 px-4 pb-4">
        <div
          className="rounded-lg p-3 text-xs space-y-1.5"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex justify-between gap-4">
            <span style={{ color: 'var(--text-muted)' }}>Huésped</span>
            <span className="font-medium text-right" style={{ color: 'var(--text-primary)' }}>
              {stay?.guest?.full_name ?? '—'}
            </span>
          </div>
          {rooms && (
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--text-muted)' }}>Habitación</span>
              <span style={{ color: 'var(--text-primary)' }}>Hab. {rooms}</span>
            </div>
          )}
          {stay && (
            <>
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--text-muted)' }}>Estadía</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {formatDateShort(stay.check_in_datetime)} → {formatDateShort(stay.check_out_datetime)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--text-muted)' }}>Total / Pagado</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {formatCOP(Number(stay.total_amount ?? 0))} / {formatCOP(Number(stay.paid_amount ?? 0))}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-4">
            <span style={{ color: 'var(--text-muted)' }}>Solicitado por</span>
            <span style={{ color: 'var(--text-primary)' }}>{request.requested_by?.name ?? '—'}</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Motivo del solicitante
          </p>
          <p
            className="text-sm rounded-lg p-3"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            {request.reason}
          </p>
        </div>

        <div className="rounded-lg p-3 text-xs" style={{ background: '#EFF6FF', color: '#1E40AF' }}>
          Al rechazar, la habitación <strong>sigue disponible</strong> (solo queda registro de auditoría).
        </div>

        <div>
          <label
            htmlFor="void-admin-notes"
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Observaciones del administrador (opcional)
          </label>
          <textarea
            id="void-admin-notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej: confirmado con recepción, error de habitación verificado..."
            className="w-full px-3 py-2 rounded-lg text-xs border focus:outline-none"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-default)',
            }}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: '#F59E0B', color: 'white' }}
          >
            {isRejecting ? 'Rechazando…' : 'Rechazar'}
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: '#22C55E', color: 'white' }}
          >
            {isApproving ? 'Aprobando…' : 'Aprobar anulación'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
