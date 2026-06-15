import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useRepairOrders } from '@/hooks/useInventory'
import { roomHasOpenMaintenanceOrder } from '@/lib/roomMaintenance'
import type { Room, RoomStatus } from '@/types'
import { STATUS_CONFIG } from './RoomStatusBadge'
import { cn } from '@/lib/cn'

const STATUSES = Object.keys(STATUS_CONFIG) as RoomStatus[]

interface Props {
  readonly room: Room
  readonly onConfirm: (status: RoomStatus, notes?: string) => void
  readonly onClose: () => void
  readonly isSaving: boolean
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

function statusSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Confirmar'
}

export function RoomStatusModal({ room, onConfirm, onClose, isSaving }: Props) {
  const [selected, setSelected] = useState<RoomStatus>(room.status)
  const [notes, setNotes]       = useState(room.notes ?? '')
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  const { data: maintenanceOrders } = useRepairOrders(
    { room_id: room.id },
    { enabled: room.status === 'maintenance' },
  )

  const hasOpenMaintenanceOrder = roomHasOpenMaintenanceOrder(
    room,
    maintenanceOrders?.data,
  )

  const changed = selected !== room.status
  const leavingMaintenanceBlocked =
    room.status === 'maintenance' && hasOpenMaintenanceOrder && selected !== 'maintenance'

  function isStatusDisabled(status: RoomStatus): boolean {
    return room.status === 'maintenance' && hasOpenMaintenanceOrder && status !== 'maintenance'
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Cambiar estado de habitación"
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
        className="relative z-10 pointer-events-auto w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Hab. {room.number}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {room.room_type.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="icon-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s]
            const isActive = selected === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelected(s)}
                disabled={isStatusDisabled(s)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all text-left',
                  isActive ? 'border-2' : 'hover:opacity-80',
                  isStatusDisabled(s) && 'opacity-40 cursor-not-allowed',
                )}
                style={{
                  borderColor:  isActive ? cfg.color : 'var(--border-default)',
                  background:   isActive ? cfg.bg : 'transparent',
                  color:        isActive ? cfg.color : 'var(--text-secondary)',
                  fontWeight:   isActive ? 600 : 400,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: cfg.color }}
                />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {leavingMaintenanceBlocked && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#FFF7ED', color: '#9A3412' }}>
            Cierre la orden de mantenimiento en Inventario antes de cambiar el estado.
          </p>
        )}

        <div>
          <label htmlFor="room-status-notes" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Notas (opcional)
          </label>
          <textarea
            id="room-status-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ej: Cliente solicita llegada tarde"
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm border transition-colors"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected, notes || undefined)}
            disabled={!changed || isSaving || leavingMaintenanceBlocked}
            aria-busy={isSaving}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            {statusSaveLabel(isSaving)}
          </button>
        </div>
      </div>
    </dialog>
  )
}
