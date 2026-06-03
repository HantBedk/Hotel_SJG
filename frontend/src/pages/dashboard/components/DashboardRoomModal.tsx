import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, BedDouble, Sparkles, Wrench, XCircle, Check, Calendar, User,
  CheckCircle2, LogOut, RefreshCw, AlertTriangle, Lock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { Room, RoomStatus, Stay } from '@/types'

interface Housekeeper { id: string; name: string }

interface Props {
  room: Room | null
  stay?: Stay | null
  housekeepers: Housekeeper[]
  isChangingStatus: boolean
  onChangeStatus: (id: string, status: RoomStatus, notes?: string) => void
  onStartCheckIn: (room: Room) => void
  onStartCheckOut?: (stay: Stay) => void
  onClose: () => void
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
  onChangeStatus, onStartCheckIn, onStartCheckOut, onClose,
}: Props) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [housekeeperId, setHousekeeperId] = useState('')

  if (!room) return null

  const meta = STATUS_META[room.status] ?? STATUS_META.available
  const canCheckIn  = hasPermission('check_in')
  const canManage   = hasPermission('manage_rooms')
  const canCheckOut = hasPermission('check_out')

  const go = (path: string) => { onClose(); navigate(path) }

  const totalAmount = stay ? Number(stay.total_amount ?? 0) : 0
  const paidAmount  = stay ? Number(stay.paid_amount ?? 0) : 0
  const balance     = totalAmount - paidAmount

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
                    onClick={() => go('/reservations')}
                    disabled={!canCheckIn}
                    icon={<Calendar size={15} />}
                    label="Asignar reserva existente"
                  />
                  <ActionButton
                    onClick={() => onChangeStatus(room.id, 'maintenance')}
                    disabled={!canManage || isChangingStatus}
                    icon={<Wrench size={15} />}
                    label="Marcar en mantenimiento"
                  />
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
                    onClick={() => go('/inventory?tab=repair-orders')}
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
                        onChangeStatus(room.id, 'available', `Limpiada por: ${hk.name}`)
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
                    onClick={() => onChangeStatus(room.id, 'maintenance')}
                    disabled={!canManage || isChangingStatus}
                    icon={<Wrench size={15} />}
                    label="Reportar daño / mantenimiento"
                  />
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
                    onClick={() => go('/inventory?tab=repair-orders')}
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
                    onClick={() => onChangeStatus(room.id, 'maintenance')}
                    disabled={!canManage || isChangingStatus}
                    icon={<Wrench size={15} />}
                    label="Pasar a mantenimiento"
                  />
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
