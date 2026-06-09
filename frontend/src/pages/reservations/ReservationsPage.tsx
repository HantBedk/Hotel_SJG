import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Plus, CalendarDays, XCircle, CreditCard, Users, Pencil } from 'lucide-react'
import { useReservations } from '@/hooks/useReservations'
import { useRooms } from '@/hooks/useRooms'
import NewReservationWizard from './components/NewReservationWizard'
import BulkReservationWizard from './components/BulkReservationWizard'
import CheckInFromReservationModal from './components/CheckInFromReservationModal'
import EditReservationModal from './components/EditReservationModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Reservation, ReservationStatus } from '@/types'

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending:    'Pendiente',
  confirmed:  'Confirmada',
  checked_in: 'En estadía',
  cancelled:  'Cancelada',
  no_show:    'No show',
}

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-sky-100 text-sky-700',
  checked_in: 'bg-green-100 text-green-700',
  cancelled:  'bg-slate-100 text-slate-500',
  no_show:    'bg-red-100 text-red-600',
}

const STATUSES: (ReservationStatus | '')[] = ['', 'pending', 'confirmed', 'checked_in', 'cancelled', 'no_show']

export default function ReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId     = searchParams.get('id')
  const deepLinkAction = searchParams.get('action')

  const [search, setSearch]               = useState('')
  const [status, setStatus]               = useState<ReservationStatus | ''>('')
  const [showWizard, setShowWizard]       = useState(false)
  const [editing, setEditing]             = useState<Reservation | null>(null)
  const [showBulk, setShowBulk]           = useState(false)
  const [checkingIn, setCheckingIn]       = useState<Reservation | null>(null)
  const [selected, setSelected]           = useState<Reservation | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState<Reservation | null>(null)

  const { reservations, isLoading, cancel, addPayment, update } = useReservations({
    status:  status || undefined,
    search:  search || undefined,
  })

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
    const res = (reservations as Reservation[]).find(r => r.id === deepLinkId)
    if (!res) return
    if (deepLinkAction === 'checkin' && ['pending', 'confirmed'].includes(res.status)) {
      setCheckingIn(res)
    } else if (deepLinkAction === 'cancel' && ['pending', 'confirmed'].includes(res.status)) {
      handleCancel(res)
    } else if (deepLinkAction === 'edit') {
      setEditing(res)
    } else {
      setSelected(res)
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('id')
      next.delete('action')
      return next
    }, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId, deepLinkAction, reservations])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold mr-auto" style={{ color: 'var(--text-primary)' }}>Reservas</h1>
        <button
          onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <Users size={15} /> Reserva grupal
        </button>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={15} /> Nueva reserva
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            placeholder="Buscar por huésped o documento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={e => setStatus(e.target.value as ReservationStatus | '')}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos los estados</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s as ReservationStatus]}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (reservations as Reservation[]).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'var(--text-muted)' }}>
            <CalendarDays size={32} strokeWidth={1} />
            <p className="text-sm">No hay reservas con este filtro.</p>
          </div>
        ) : (
          (reservations as Reservation[]).map(res => (
            <ReservationCard
              key={res.id}
              reservation={res}
              onSelect={() => setSelected(res)}
              onCheckIn={() => setCheckingIn(res)}
              onCancel={() => handleCancel(res)}
            />
          ))
        )}
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
      <ConfirmDialog
        open={confirmingCancel !== null}
        title="Cancelar reserva"
        message={
          <>
            ¿Estás seguro que quieres cancelar la reserva de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {confirmingCancel?.guest?.full_name ?? 'este cliente'}
            </strong>
            ? Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Sí, cancelar reserva"
        cancelLabel="Volver"
        variant="danger"
        onConfirm={confirmCancel}
        onClose={() => setConfirmingCancel(null)}
      />
    </div>
  )
}

function ReservationCard({
  reservation: res,
  onSelect,
  onCheckIn,
  onCancel,
}: {
  reservation: Reservation
  onSelect: () => void
  onCheckIn: () => void
  onCancel: () => void
}) {
  const nights = res.nights
  const canCheckIn = ['pending', 'confirmed'].includes(res.status)
  const canCancel  = ['pending', 'confirmed'].includes(res.status)

  return (
    <div
      className="rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[res.status]}`}>
              {STATUS_LABELS[res.status]}
            </span>
            {res.company && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Empresa
              </span>
            )}
          </div>

          <p className="mt-1 font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {res.guest?.full_name ?? res.company?.name ?? '—'}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <CalendarDays size={11} />
              {res.start_date} → {res.end_date} · {nights} noche{nights !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              ${Number(res.agreed_price).toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {canCheckIn && (
            <button
              onClick={onCheckIn}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              Check-in
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface PayForm {
  amount: string
  payment_method: string
  payment_type: string
}

function ReservationDetailPanel({
  reservation: res,
  onClose,
  onCheckIn,
  onCancel,
  onEdit,
  onAddPayment,
}: {
  reservation: Reservation
  onClose: () => void
  onCheckIn: () => void
  onCancel: () => void
  onEdit: () => void
  onAddPayment: (payload: { amount: number; payment_method: string; payment_type: string }) => void
}) {
  const canCheckIn  = ['pending', 'confirmed'].includes(res.status)
  const canCancel   = ['pending', 'confirmed'].includes(res.status)
  const canEdit     = ['pending', 'confirmed'].includes(res.status)
  const canPayment  = ['pending', 'confirmed'].includes(res.status) && res.payment_status !== 'paid'

  const [showPayForm, setShowPayForm] = useState(false)
  const [payForm, setPayForm] = useState<PayForm>({
    amount: '',
    payment_method: 'cash',
    payment_type:   'deposit',
  })

  const handlePay = () => {
    const amount = parseFloat(payForm.amount)
    if (!amount || amount <= 0) return
    onAddPayment({ amount, payment_method: payForm.payment_method, payment_type: payForm.payment_type })
    setShowPayForm(false)
    setPayForm({ amount: '', payment_method: 'cash', payment_type: 'deposit' })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Detalle de reserva</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><XCircle size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          <DetailRow label="Estado">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[res.status]}`}>
              {STATUS_LABELS[res.status]}
            </span>
          </DetailRow>
          <DetailRow label="Huésped" value={res.guest?.full_name ?? '—'} />
          {res.company && <DetailRow label="Empresa" value={res.company.name} />}
          <DetailRow label="Llegada" value={res.start_date} />
          <DetailRow label="Salida" value={res.end_date} />
          <DetailRow label="Noches" value={String(res.nights)} />
          <DetailRow label="Precio total" value={`$${Number(res.agreed_price).toLocaleString('es-CO')}`} />
          {res.deposit_amount && Number(res.deposit_amount) > 0 && (
            <DetailRow label="Abonado" value={`$${Number(res.deposit_amount).toLocaleString('es-CO')}`} />
          )}
          <DetailRow label="Pago" value={res.payment_status === 'paid' ? 'Pagado' : res.payment_status === 'partial' ? 'Parcial' : 'Pendiente'} />
          {res.notes && <DetailRow label="Notas" value={res.notes} />}

          {/* Payment form */}
          {showPayForm && (
            <div className="rounded-xl p-4 space-y-3 border mt-2"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Registrar pago</p>
              <input
                type="number" min="0" placeholder="Monto"
                value={payForm.amount}
                onChange={e => setPayForm(s => ({ ...s, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={payForm.payment_method}
                  onChange={e => setPayForm(s => ({ ...s, payment_method: e.target.value }))}
                  className="px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="credito">Crédito</option>
                </select>
                <select value={payForm.payment_type}
                  onChange={e => setPayForm(s => ({ ...s, payment_type: e.target.value }))}
                  className="px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                  <option value="deposit">Depósito</option>
                  <option value="partial">Parcial</option>
                  <option value="final">Total</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePay} disabled={!payForm.amount}
                  className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  Guardar
                </button>
                <button onClick={() => setShowPayForm(false)}
                  className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {canEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <Pencil size={14} /> Editar
            </button>
          )}
          {canPayment && !showPayForm && (
            <button
              onClick={() => setShowPayForm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <CreditCard size={14} /> Pago
            </button>
          )}
          {canCheckIn && (
            <button
              onClick={onCheckIn}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              Hacer Check-in
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      {children ?? <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>}
    </div>
  )
}
