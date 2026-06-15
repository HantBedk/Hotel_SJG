import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Plus, CalendarDays, XCircle, CreditCard, Users, Pencil, CalendarPlus } from 'lucide-react'
import { useReservations } from '@/hooks/useReservations'
import { useRooms } from '@/hooks/useRooms'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import NewReservationWizard from './components/NewReservationWizard'
import BulkReservationWizard from './components/BulkReservationWizard'
import CheckInFromReservationModal from './components/CheckInFromReservationModal'
import EditReservationModal from './components/EditReservationModal'
import { ReservationStatusBadge } from './components/ReservationCard'
import ReservationGroupPanel from './components/ReservationGroupPanel'
import ReservationStatusCards, { reservationsForListView } from './components/ReservationStatusCards'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { Reservation } from '@/types'
import {
  type ReservationGroupKey,
  PAYMENT_CONFIG,
  formatCurrency,
  formatReservationDate,
  isActiveReservation,
  nightLabel,
  reservationGuestLabel,
  reservationRoomLabel,
} from './reservationPageUtils'

const RESERVATION_SKELETON_KEYS = [
  'reservation-skeleton-1',
  'reservation-skeleton-2',
  'reservation-skeleton-3',
  'reservation-skeleton-4',
  'reservation-skeleton-5',
  'reservation-skeleton-6',
] as const

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

function paymentStatusLabel(status: string): string {
  return PAYMENT_CONFIG[status as keyof typeof PAYMENT_CONFIG]?.label ?? status
}

interface EmptyReservationsProps {
  readonly hasFilters: boolean
  readonly onClearFilters: () => void
  readonly onNewReservation: () => void
  readonly onBulkReservation: () => void
}

function EmptyReservationsState({
  hasFilters,
  onClearFilters,
  onNewReservation,
  onBulkReservation,
}: EmptyReservationsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-input)' }}
      >
        <CalendarDays size={28} strokeWidth={1.25} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {hasFilters ? 'Sin resultados' : 'No hay reservas programadas'}
      </p>
      <p className="text-xs max-w-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        {hasFilters
          ? 'Prueba con otro término de búsqueda o selecciona otra categoría.'
          : 'Crea la primera reserva para comenzar a gestionar llegadas y pagos anticipados.'}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="px-4 py-2 rounded-lg text-sm font-medium border hover:opacity-80"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Limpiar filtros
        </button>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={onNewReservation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Nueva reserva
          </button>
          <button
            type="button"
            onClick={onBulkReservation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            <Users size={15} /> Reserva grupal
          </button>
        </div>
      )}
    </div>
  )
}

export default function ReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId     = searchParams.get('id')
  const deepLinkAction = searchParams.get('action')

  const [search, setSearch]               = useState('')
  const [groupFilter, setGroupFilter]     = useState<ReservationGroupKey | ''>('')
  const [showWizard, setShowWizard]       = useState(false)
  const [editing, setEditing]             = useState<Reservation | null>(null)
  const [showBulk, setShowBulk]           = useState(false)
  const [checkingIn, setCheckingIn]       = useState<Reservation | null>(null)
  const [selected, setSelected]           = useState<Reservation | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState<Reservation | null>(null)

  const { reservations, isLoading, cancel, addPayment, update } = useReservations({
    search: search || undefined,
  })

  const reservationList = reservations as Reservation[]

  const { rooms } = useRooms()

  const handleCancel = (res: Reservation) => {
    setConfirmingCancel(res)
  }

  const confirmCancel = () => {
    if (!confirmingCancel) return
    cancel({ id: confirmingCancel.id })
    setConfirmingCancel(null)
    setSelected(null)
  }

  // Deep-link: aplicar ?id y ?action al cargar la lista
  useEffect(() => {
    if (!deepLinkId) return

    const clearDeepLinkParams = () => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('id')
        next.delete('action')
        return next
      }, { replace: true })
    }

    const res = reservationList.find((r) => r.id === deepLinkId)
    if (!res) {
      clearDeepLinkParams()
      return
    }

    if (deepLinkAction === 'checkin' && ['pending', 'confirmed'].includes(res.status)) {
      setCheckingIn(res)
    } else if (deepLinkAction === 'cancel' && ['pending', 'confirmed'].includes(res.status)) {
      handleCancel(res)
    } else if (deepLinkAction === 'edit') {
      setEditing(res)
    } else {
      setSelected(res)
    }
    clearDeepLinkParams()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId, deepLinkAction, reservationList])

  const hasFilters = Boolean(search.trim() || groupFilter)

  const listGroups = useMemo(
    () => reservationsForListView(reservationList, groupFilter),
    [reservationList, groupFilter],
  )

  const visibleCount = useMemo(
    () => listGroups.reduce((sum, group) => sum + group.items.length, 0),
    [listGroups],
  )

  const clearFilters = () => {
    setSearch('')
    setGroupFilter('')
  }

  let listContent
  if (isLoading) {
    listContent = (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {RESERVATION_SKELETON_KEYS.slice(0, 4).map((key) => (
            <Skeleton key={key} className="h-[84px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  } else if (reservationList.length === 0 || visibleCount === 0) {
    listContent = (
      <EmptyReservationsState
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        onNewReservation={() => setShowWizard(true)}
        onBulkReservation={() => setShowBulk(true)}
      />
    )
  } else {
    listContent = (
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
        {listGroups.map((group) => (
          <ReservationGroupPanel
            key={group.key}
            label={group.label}
            count={group.items.length}
            items={group.items}
            onSelect={setSelected}
            onCheckIn={setCheckingIn}
            onCancel={handleCancel}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reservas</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <Users size={15} /> Reserva grupal
        </button>
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <CalendarPlus size={15} /> Nueva reserva
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="Buscar por huésped o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-xs font-medium border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {!isLoading && (
          <ReservationStatusCards
            reservations={reservationList}
            selected={groupFilter}
            onSelect={setGroupFilter}
          />
        )}
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {listContent}
      </div>

      {/* Detail panel */}
      {selected && (
        <ReservationDetailPanel
          reservation={selected}
          onClose={() => setSelected(null)}
          onCheckIn={() => { setCheckingIn(selected); setSelected(null) }}
          onCancel={() => handleCancel(selected)}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onAddPayment={(payload) => addPayment({ id: selected.id, ...payload })}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <EditReservationModal
          reservation={editing}
          onSave={(payload) => {
            update(payload)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* New reservation wizard */}
      {showWizard && (
        <NewReservationWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => setShowWizard(false)}
        />
      )}

      {showBulk && (
        <BulkReservationWizard
          onClose={() => setShowBulk(false)}
          onSuccess={() => setShowBulk(false)}
        />
      )}

      {/* Check-in from reservation modal */}
      {checkingIn && (
        <CheckInFromReservationModal
          reservation={checkingIn}
          rooms={rooms}
          onClose={() => setCheckingIn(null)}
          onSuccess={() => setCheckingIn(null)}
        />
      )}

      {/* Cancel reservation confirmation */}
      {confirmingCancel && (
        <ConfirmDialog
          open
          title="Cancelar reserva"
          message={
            <>
              ¿Estás seguro que quieres cancelar la reserva de{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {confirmingCancel.guest?.full_name ?? 'este cliente'}
              </strong>
              {' '}? Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Sí, cancelar reserva"
          cancelLabel="Volver"
          variant="danger"
          onConfirm={confirmCancel}
          onClose={() => setConfirmingCancel(null)}
        />
      )}
    </div>
  )
}

interface PayForm {
  amount: string
  payment_method: string
  payment_type: string
}

interface ReservationDetailPanelProps {
  readonly reservation: Reservation
  readonly onClose: () => void
  readonly onCheckIn: () => void
  readonly onCancel: () => void
  readonly onEdit: () => void
  readonly onAddPayment: (payload: { amount: number; payment_method: string; payment_type: string }) => void
}

function ReservationDetailPanel({
  reservation: res,
  onClose,
  onCheckIn,
  onCancel,
  onEdit,
  onAddPayment,
}: ReservationDetailPanelProps) {
  const canCheckIn  = isActiveReservation(res.status)
  const canCancel   = isActiveReservation(res.status)
  const canEdit     = isActiveReservation(res.status)
  const canPayment  = isActiveReservation(res.status) && res.payment_status !== 'paid'
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)
  const roomLabel = reservationRoomLabel(res)
  const guestName = reservationGuestLabel(res)

  const [showPayForm, setShowPayForm] = useState(false)
  const [payForm, setPayForm] = useState<PayForm>({
    amount: '',
    payment_method: 'cash',
    payment_type:   'deposit',
  })

  const handlePay = () => {
    const amount = Number.parseFloat(payForm.amount)
    if (!amount || amount <= 0) return
    onAddPayment({ amount, payment_method: payForm.payment_method, payment_type: payForm.payment_type })
    setShowPayForm(false)
    setPayForm({ amount: '', payment_method: 'cash', payment_type: 'deposit' })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Detalle de reserva"
      className={cn(
        'app-modal fixed inset-0 z-40 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-end sm:items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="min-w-0">
            <h2 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{guestName}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Detalle de reserva</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <DetailRow label="Estado">
            <ReservationStatusBadge status={res.status} />
          </DetailRow>
          {res.guest && <DetailRow label="Huésped" value={res.guest.full_name} />}
          {res.company && <DetailRow label="Empresa" value={res.company.name} />}
          {roomLabel && <DetailRow label="Alojamiento" value={roomLabel} />}
          <DetailRow label="Llegada" value={formatReservationDate(res.start_date)} />
          <DetailRow label="Salida" value={formatReservationDate(res.end_date)} />
          <DetailRow label="Noches" value={nightLabel(res.nights)} />
          <DetailRow label="Precio total" value={formatCurrency(res.agreed_price)} />
          {res.deposit_amount && Number(res.deposit_amount) > 0 && (
            <DetailRow label="Abonado" value={formatCurrency(res.deposit_amount)} />
          )}
          <DetailRow label="Pago" value={paymentStatusLabel(res.payment_status)} />
          {res.notes && <DetailRow label="Notas" value={res.notes} />}

          {/* Payment form */}
          {showPayForm && (
            <div className="rounded-xl p-4 space-y-3 border mt-2"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Registrar pago</p>
              <input
                type="number" min="0" placeholder="Monto"
                value={payForm.amount}
                onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={payForm.payment_method}
                  onChange={(e) => setPayForm((s) => ({ ...s, payment_method: e.target.value }))}
                  className="px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="credito">Crédito</option>
                </select>
                <select value={payForm.payment_type}
                  onChange={(e) => setPayForm((s) => ({ ...s, payment_type: e.target.value }))}
                  className="px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                  <option value="deposit">Depósito</option>
                  <option value="partial">Parcial</option>
                  <option value="final">Total</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={!payForm.amount}
                  className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <Pencil size={14} /> Editar
            </button>
          )}
          {canPayment && !showPayForm && (
            <button
              type="button"
              onClick={() => setShowPayForm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <CreditCard size={14} /> Pago
            </button>
          )}
          {canCheckIn && (
            <button
              type="button"
              onClick={onCheckIn}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              Hacer Check-in
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}

interface DetailRowProps {
  readonly label: string
  readonly value?: string
  readonly children?: ReactNode
}

function DetailRow({ label, value, children }: DetailRowProps) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border-default)' }}>
      <span className="shrink-0 text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
      {children ?? (
        <span className="font-medium text-right break-words" style={{ color: 'var(--text-primary)' }}>{value}</span>
      )}
    </div>
  )
}
