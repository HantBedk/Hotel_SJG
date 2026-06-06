import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, BedDouble, Sparkles, Wrench, XCircle, Check, Calendar, User,
  CheckCircle2, LogOut, RefreshCw, AlertTriangle, Lock, CreditCard,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useReservations } from '@/hooks/useReservations'
import type { Reservation, Room, RoomStatus, Stay } from '@/types'

interface Housekeeper { id: string; name: string }

interface AddPaymentPayload {
  stayId: string
  amount: number
  payment_method: string
  payment_type: string
  paid_by: string
  notes?: string
}

interface Props {
  room: Room | null
  stay?: Stay | null
  housekeepers: Housekeeper[]
  isChangingStatus: boolean
  onChangeStatus: (id: string, status: RoomStatus, notes?: string) => void
  onStartCheckIn: (room: Room) => void
  onStartCheckOut?: (stay: Stay) => void
  onAddPayment?: (payload: AddPaymentPayload) => void
  onSelectReservation?: (reservation: Reservation) => void
  onClose: () => void
}

interface PaymentForm {
  amount: string
  payment_method: string
  payment_type: string
  paid_by: string
  notes: string
}

const EMPTY_PAYMENT: PaymentForm = {
  amount: '',
  payment_method: 'cash',
  payment_type: 'partial',
  paid_by: 'guest',
  notes: '',
}

const STATUS_META: Record<RoomStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  available:   { label: 'Disponible',   color: '#22C55E', bg: '#ECFDF5', Icon: BedDouble },
  occupied:    { label: 'Ocupada',      color: '#EF4444', bg: '#FEF2F2', Icon: Check },
  reserved:    { label: 'Reservada',    color: '#F59E0B', bg: '#FFFBEB', Icon: Calendar },
  cleaning:    { label: 'Limpieza',     color: '#8B5CF6', bg: '#F5F3FF', Icon: Sparkles },
  maintenance: { label: 'Mantenimiento', color: '#F97316', bg: '#FFF7ED', Icon: Wrench },
  blocked:     { label: 'Bloqueada',    color: '#94A3B8', bg: '#F1F5F9', Icon: XCircle },
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function DashboardRoomModal({
  room, stay, housekeepers, isChangingStatus,
  onChangeStatus, onStartCheckIn, onStartCheckOut, onAddPayment,
  onSelectReservation, onClose,
}: Props) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [housekeeperId, setHousekeeperId] = useState('')
  const [showPayForm, setShowPayForm] = useState(false)
  const [payForm, setPayForm] = useState<PaymentForm>(EMPTY_PAYMENT)
  const [showReservationPicker, setShowReservationPicker] = useState(false)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [maintenanceReason, setMaintenanceReason] = useState('')

  useEffect(() => {
    setShowPayForm(false)
    setPayForm(EMPTY_PAYMENT)
  }, [room?.id])

  if (!room) return null

  const meta = STATUS_META[room.status] ?? STATUS_META.available
  const canCheckIn  = hasPermission('check_in')
  const canManage   = hasPermission('manage_rooms')
  const canCheckOut = hasPermission('check_out')
  const canPay      = hasPermission('check_in')

  const go = (path: string) => { onClose(); navigate(path) }

  const totalAmount = stay ? Number(stay.total_amount ?? 0) : 0
  const paidAmount  = stay ? Number(stay.paid_amount ?? 0) : 0
  const balance     = totalAmount - paidAmount

  const handleSubmitPayment = () => {
    if (!stay || !onAddPayment) return
    const amount = parseFloat(payForm.amount)
    if (!amount || amount <= 0) return
    onAddPayment({
      stayId: stay.id,
      amount,
      payment_method: payForm.payment_method,
      payment_type: payForm.payment_type,
      paid_by: stay.company ? payForm.paid_by : 'guest',
      notes: payForm.notes || undefined,
    })
    setShowPayForm(false)
    setPayForm(EMPTY_PAYMENT)
  }

  const handleSubmitMaintenance = () => {
    const reason = maintenanceReason.trim()
    if (!reason) return
    onChangeStatus(room.id, 'maintenance', reason)
    setShowMaintenanceForm(false)
    setMaintenanceReason('')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        style={{ background: 'var(--bg-surface)', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
              style={{ background: meta.color }}
            >
              {room.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Habitación {room.number}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {room.room_type?.name ?? 'Sin tipo'}
                {room.floor != null && ` · Piso ${room.floor}`}
                {room.house && ` · ${room.house.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Banner de inconsistencia: ocupada pero sin estadía activa */}
          {room.status === 'occupied' && !stay && (
            <div
              className="rounded-xl p-3 flex items-start gap-3"
              style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: '#92400E' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#92400E' }}>
                  Estado inconsistente
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>
                  La habitación está marcada como «ocupada» pero no hay una estadía activa.
                  Probablemente quedó un check-out sin cerrar. Podés liberarla y dejarla disponible.
                </p>
                <button
                  disabled={!canManage || isChangingStatus}
                  onClick={() => onChangeStatus(
                    room.id,
                    'available',
                    'Liberada manualmente desde alerta de inconsistencia',
                  )}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                  style={{ background: '#F59E0B', color: '#fff' }}
                >
                  {isChangingStatus
                    ? <RefreshCw size={13} className="animate-spin" />
                    : <CheckCircle2 size={13} />}
                  Marcar como disponible
                </button>
              </div>
            </div>
          )}

          {/* Estadía activa (solo si ocupada y hay stay) */}
          {room.status === 'occupied' && stay && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
            >
              <h3
                className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <User size={13} /> Estadía activa
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Huésped titular</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stay.guest?.full_name ?? '—'}
                  </p>
                  {stay.guest?.document_number && (
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {stay.guest.document_type?.toUpperCase()} {stay.guest.document_number}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Estadía</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatDateShort(stay.check_in_datetime)} → {formatDateShort(stay.check_out_datetime)}
                  </p>
                </div>
                {stay.company && (
                  <div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Empresa</p>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stay.company.name}</p>
                    {stay.company.nit && (
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        NIT {stay.company.nit}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Saldo</p>
                  <p
                    className="font-bold tabular-nums"
                    style={{ color: balance > 0 ? '#EF4444' : '#22C55E' }}
                  >
                    ${balance.toLocaleString('es-CO')}
                    <span className="font-normal text-[11px] ml-1" style={{ color: 'var(--text-muted)' }}>
                      / ${totalAmount.toLocaleString('es-CO')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notas de la habitación */}
          {room.notes && (
            <div
              className="rounded-xl p-3 text-xs italic"
              style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
            >
              {room.notes}
            </div>
          )}

          {/* Acciones rápidas */}
          <div>
            <h3
              className="text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Acciones rápidas
            </h3>
            <div className="space-y-2">

              {/* DISPONIBLE */}
              {room.status === 'available' && (
                <>
                  <ActionButton
                    onClick={() => { onClose(); onStartCheckIn(room) }}
                    disabled={!canCheckIn}
                    icon={<CheckCircle2 size={15} />}
                    label="Walk-in / Check-in inmediato"
                    primary
                  />
                  <ActionButton
                    onClick={() => setShowReservationPicker((v) => !v)}
                    disabled={!canCheckIn}
                    icon={<Calendar size={15} />}
                    label={showReservationPicker ? 'Cancelar selección' : 'Asignar reserva existente'}
                  />
                  {showReservationPicker && (
                    <ReservationPickerInline
                      roomId={room.id}
                      onSelect={(reservation) => {
                        if (!onSelectReservation) return
                        onClose()
                        onSelectReservation(reservation)
                      }}
                    />
                  )}
                  <ActionButton
                    onClick={() => setShowMaintenanceForm((v) => !v)}
                    disabled={!canManage || isChangingStatus}
                    icon={<Wrench size={15} />}
                    label={showMaintenanceForm ? 'Cancelar mantenimiento' : 'Marcar en mantenimiento'}
                  />
                  {showMaintenanceForm && (
                    <MaintenanceInlineForm
                      reason={maintenanceReason}
                      isSubmitting={isChangingStatus}
                      onChange={setMaintenanceReason}
                      onSubmit={handleSubmitMaintenance}
                      onCancel={() => { setShowMaintenanceForm(false); setMaintenanceReason('') }}
                    />
                  )}
                  <ActionButton
                    onClick={() => onChangeStatus(room.id, 'blocked')}
                    disabled={!canManage || isChangingStatus}
                    icon={<Lock size={15} />}
                    label="Bloquear habitación"
                  />
                </>
              )}

              {/* OCUPADA */}
              {room.status === 'occupied' && (
                <>
                  {stay && (
                    <ActionButton
                      onClick={() => go(`/stays?id=${stay.id}`)}
                      disabled={!canCheckIn}
                      icon={<User size={15} />}
                      label="Ver detalle de estadía"
                      primary
                    />
                  )}
                  {stay && onAddPayment && (
                    <ActionButton
                      onClick={() => setShowPayForm((v) => !v)}
                      disabled={!canPay}
                      icon={<CreditCard size={15} />}
                      label={showPayForm ? 'Cancelar abono' : 'Registrar abono'}
                    />
                  )}
                  {stay && onAddPayment && showPayForm && (
                    <PaymentInlineForm
                      form={payForm}
                      balance={balance}
                      hasCompany={!!stay.company}
                      onChange={setPayForm}
                      onSubmit={handleSubmitPayment}
                      onCancel={() => { setShowPayForm(false); setPayForm(EMPTY_PAYMENT) }}
                    />
                  )}
                  {stay && (
                    <ActionButton
                      onClick={() => {
                        if (onStartCheckOut) {
                          onClose()
                          onStartCheckOut(stay)
                        } else {
                          go(`/stays?id=${stay.id}&action=checkout`)
                        }
                      }}
                      disabled={!canCheckOut}
                      icon={<LogOut size={15} />}
                      label="Procesar check-out"
                    />
                  )}
                  <ActionButton
                    onClick={() => go('/inventory?tab=reparaciones')}
                    disabled={!canManage}
                    icon={<AlertTriangle size={15} />}
                    label="Reportar incidente / mantenimiento"
                  />
                </>
              )}

              {/* RESERVADA */}
              {room.status === 'reserved' && (
                <>
                  <ActionButton
                    onClick={() => go('/reservations')}
                    disabled={!canCheckIn}
                    icon={<Calendar size={15} />}
                    label="Ver reserva y hacer check-in"
                    primary
                  />
                </>
              )}

              {/* LIMPIEZA */}
              {room.status === 'cleaning' && (
                <>
                  <div
                    className="rounded-lg p-3 space-y-2"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  >
                    <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Asignar a quien limpió
                    </label>
                    <select
                      value={housekeeperId}
                      onChange={(e) => setHousekeeperId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">Selecciona personal…</option>
                      {housekeepers.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    <button
                      disabled={!housekeeperId || isChangingStatus || !canManage}
                      onClick={() => {
                        const hk = housekeepers.find((h) => h.id === housekeeperId)
                        if (!hk) return
                        onChangeStatus(room.id, 'available')
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: '#22C55E', color: '#fff' }}
                    >
                      {isChangingStatus
                        ? <RefreshCw size={15} className="animate-spin" />
                        : <CheckCircle2 size={15} />}
                      Marcar limpia y disponible
                    </button>
                  </div>
                  <ActionButton
                    onClick={() => setShowMaintenanceForm((v) => !v)}
                    disabled={!canManage || isChangingStatus}
                    icon={<Wrench size={15} />}
                    label={showMaintenanceForm ? 'Cancelar mantenimiento' : 'Reportar daño / mantenimiento'}
                  />
                  {showMaintenanceForm && (
                    <MaintenanceInlineForm
                      reason={maintenanceReason}
                      isSubmitting={isChangingStatus}
                      onChange={setMaintenanceReason}
                      onSubmit={handleSubmitMaintenance}
                      onCancel={() => { setShowMaintenanceForm(false); setMaintenanceReason('') }}
                    />
                  )}
                </>
              )}

              {/* MANTENIMIENTO */}
              {room.status === 'maintenance' && (
                <>
                  <ActionButton
                    onClick={() => onChangeStatus(room.id, 'available')}
                    disabled={!canManage || isChangingStatus}
                    icon={<CheckCircle2 size={15} />}
                    label="Marcar como disponible"
                    primary
                  />
                  <ActionButton
                    onClick={() => go('/inventory?tab=reparaciones')}
                    icon={<Wrench size={15} />}
                    label="Ver órdenes de reparación"
                  />
                </>
              )}

              {/* BLOQUEADA */}
              {room.status === 'blocked' && (
                <>
                  <ActionButton
                    onClick={() => onChangeStatus(room.id, 'available')}
                    disabled={!canManage || isChangingStatus}
                    icon={<CheckCircle2 size={15} />}
                    label="Liberar habitación"
                    primary
                  />
                  <ActionButton
                    onClick={() => setShowMaintenanceForm((v) => !v)}
                    disabled={!canManage || isChangingStatus}
                    icon={<Wrench size={15} />}
                    label={showMaintenanceForm ? 'Cancelar mantenimiento' : 'Pasar a mantenimiento'}
                  />
                  {showMaintenanceForm && (
                    <MaintenanceInlineForm
                      reason={maintenanceReason}
                      isSubmitting={isChangingStatus}
                      onChange={setMaintenanceReason}
                      onSubmit={handleSubmitMaintenance}
                      onCancel={() => { setShowMaintenanceForm(false); setMaintenanceReason('') }}
                    />
                  )}
                </>
              )}

            </div>
          </div>

          {/* Info rápida */}
          <div
            className="rounded-xl p-3 grid grid-cols-3 gap-3 text-xs"
            style={{ background: 'var(--bg-input)' }}
          >
            <div>
              <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Tipo</p>
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{room.room_type?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Piso</p>
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{room.floor ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Precio base</p>
              <p className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                ${Number(room.room_type?.base_price ?? 0).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ReservationPickerInlineProps {
  roomId: string
  onSelect: (reservation: Reservation) => void
}

const RES_STATUS_META: Record<'pending' | 'confirmed', { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  color: '#92400E', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmada', color: '#075985', bg: '#E0F2FE' },
}

function ReservationPickerInline({ roomId, onSelect }: ReservationPickerInlineProps) {
  const { reservations, isLoading } = useReservations({ per_page: 50 })

  const list = (reservations as Reservation[])
    .filter((r) => r.status === 'pending' || r.status === 'confirmed')
    .sort((a, b) => {
      const aMatch = a.room_id === roomId ? 0 : 1
      const bMatch = b.room_id === roomId ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

  return (
    <div
      className="rounded-lg p-2 space-y-2"
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Reservas disponibles
        </p>
        {!isLoading && list.length > 0 && (
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {list.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : list.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No hay reservas pendientes para asignar.
          </p>
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {list.map((r) => {
            const meta = RES_STATUS_META[r.status as 'pending' | 'confirmed']
            const isPreferred = r.room_id === roomId
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full text-left rounded-lg p-2.5 transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--bg-surface)',
                  border: isPreferred ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {r.guest?.full_name ?? r.company?.name ?? '—'}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatDateShort(r.start_date)} → {formatDateShort(r.end_date)}
                      {r.nights ? ` · ${r.nights}n` : ''}
                      {r.room?.number && ` · Hab. ${r.room.number}`}
                    </p>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ActionButtonProps {
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
  primary?: boolean
}

function ActionButton({ onClick, disabled, icon, label, primary }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 text-left"
      style={
        primary
          ? { background: 'var(--color-primary)', color: '#fff' }
          : { background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
    </button>
  )
}

interface PaymentInlineFormProps {
  form: PaymentForm
  balance: number
  hasCompany: boolean
  onChange: (form: PaymentForm) => void
  onSubmit: () => void
  onCancel: () => void
}

function PaymentInlineForm({ form, balance, hasCompany, onChange, onSubmit, onCancel }: PaymentInlineFormProps) {
  const amount = parseFloat(form.amount)
  const isValid = !!amount && amount > 0
  const exceedsBalance = isValid && balance > 0 && amount > balance

  return (
    <div
      className="rounded-xl p-3 space-y-3 border"
      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Nuevo abono
        </p>
        <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          Saldo: <span className="font-semibold" style={{ color: balance > 0 ? '#EF4444' : '#22C55E' }}>
            ${balance.toLocaleString('es-CO')}
          </span>
        </p>
      </div>

      <div className={hasCompany ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2'}>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Monto"
          value={form.amount}
          onChange={(e) => onChange({ ...form, amount: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
        />
        <select
          value={form.payment_method}
          onChange={(e) => onChange({ ...form, payment_method: e.target.value })}
          className="px-2 py-2 rounded-lg text-xs border outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
        >
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
        </select>
        {hasCompany && (
          <select
            value={form.paid_by}
            onChange={(e) => onChange({ ...form, paid_by: e.target.value })}
            className="px-2 py-2 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <option value="guest">Huésped</option>
            <option value="company">Empresa</option>
            <option value="mixed">Mixto</option>
          </select>
        )}
      </div>
      {exceedsBalance && (
        <p className="text-[11px]" style={{ color: '#F59E0B' }}>El monto supera el saldo pendiente.</p>
      )}

      <input
        type="text"
        placeholder="Observaciones (opcional)"
        value={form.notes}
        onChange={(e) => onChange({ ...form, notes: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
      />

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={!isValid}
          className="flex-1 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Guardar abono
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

interface MaintenanceInlineFormProps {
  reason: string
  isSubmitting: boolean
  onChange: (reason: string) => void
  onSubmit: () => void
  onCancel: () => void
}

function MaintenanceInlineForm({ reason, isSubmitting, onChange, onSubmit, onCancel }: MaintenanceInlineFormProps) {
  const isValid = reason.trim().length > 0

  return (
    <div
      className="rounded-xl p-3 space-y-3 border"
      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center gap-2">
        <Wrench size={13} style={{ color: '#F97316' }} />
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          ¿Cuál es el problema de la habitación?
        </p>
      </div>

      <textarea
        autoFocus
        rows={3}
        placeholder="Ej: aire acondicionado dañado, fuga en el baño, bombillo quemado…"
        value={reason}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
      />

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
          style={{ background: '#F97316', color: '#fff' }}
        >
          {isSubmitting
            ? <RefreshCw size={13} className="animate-spin" />
            : <Wrench size={13} />}
          Enviar a mantenimiento
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
