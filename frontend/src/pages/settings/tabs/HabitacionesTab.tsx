import { useState, useEffect, type SubmitEvent, type Dispatch, type SetStateAction } from 'react'
import { Plus, Pencil, Trash2, DollarSign, X } from 'lucide-react'
import { useAdminRooms, useAdminRoomMutations, useAdminRoomTypes, useRoomTypeMutations } from '@/hooks/useAdmin'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { Room, RoomType } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/cn'

const STATUS_LABELS: Record<string, string> = {
  available:   'Disponible',
  occupied:    'Ocupada',
  reserved:    'Reservada',
  cleaning:    'Limpieza',
  maintenance: 'Mantenimiento',
  blocked:     'Bloqueada',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  available:   { bg: '#D1FAE5', color: '#065F46' },
  occupied:    { bg: '#FEE2E2', color: '#991B1B' },
  reserved:    { bg: '#DBEAFE', color: '#1E40AF' },
  cleaning:    { bg: '#FEF3C7', color: '#92400E' },
  maintenance: { bg: '#F3E8FF', color: '#6B21A8' },
  blocked:     { bg: '#F3F4F6', color: '#374151' },
}

type RoomForm = {
  room_type_id: string
  number: string
  floor: string
  notes: string
  is_active: boolean
}

const EMPTY: RoomForm = { room_type_id: '', number: '', floor: '', notes: '', is_active: true }

type MassPriceForm = { room_type_id: string; base_price: string }

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

function roomFieldId(key: keyof RoomForm): string {
  return `room-field-${key}`
}

function roomFormTitle(editing: Room | null): string {
  if (editing) return `Editar hab. ${editing.number}`
  return 'Nueva habitación'
}

function roomSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Guardar'
}

function massPriceSaveLabel(pending: boolean): string {
  if (pending) return 'Actualizando…'
  return 'Actualizar'
}

function activeBadgeStyle(isActive: boolean): { background: string; color: string } {
  if (isActive) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function activeBadgeLabel(isActive: boolean): string {
  if (isActive) return 'Sí'
  return 'No'
}

function statusBadgeStyle(status: string): { background: string; color: string } {
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.blocked
  return { background: sc.bg, color: sc.color }
}

function roomToForm(room: Room): RoomForm {
  return {
    room_type_id: room.room_type_id,
    number: room.number,
    floor: room.floor ? String(room.floor) : '',
    notes: room.notes ?? '',
    is_active: room.is_active,
  }
}

function buildRoomPayload(form: RoomForm) {
  return {
    room_type_id: form.room_type_id,
    number: form.number,
    floor: form.floor ? Number.parseInt(form.floor, 10) : null,
    notes: form.notes || null,
  }
}

interface RoomFormFieldProps {
  readonly fieldKey: keyof RoomForm
  readonly label: string
  readonly type?: string
  readonly children?: React.ReactNode
  readonly form: RoomForm
  readonly setForm: Dispatch<SetStateAction<RoomForm>>
}

function RoomFormField({ fieldKey, label, type = 'text', children, form, setForm }: RoomFormFieldProps) {
  const inputId = roomFieldId(fieldKey)

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children ?? (
        <input
          id={inputId}
          type={type}
          value={String(form[fieldKey])}
          onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
          style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        />
      )}
    </div>
  )
}

interface RoomFormModalProps {
  readonly editing: Room | null
  readonly form: RoomForm
  readonly types: RoomType[]
  readonly saving: boolean
  readonly onClose: () => void
  readonly setForm: Dispatch<SetStateAction<RoomForm>>
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function RoomFormModal({ editing, form, types, saving, onClose, setForm, onSubmit }: RoomFormModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={roomFormTitle(editing)}
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
      <form
        onSubmit={onSubmit}
        className="relative z-10 pointer-events-auto rounded-xl p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {roomFormTitle(editing)}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <RoomFormField fieldKey="room_type_id" label="Tipo de habitación *" form={form} setForm={setForm}>
          <select
            id={roomFieldId('room_type_id')}
            value={form.room_type_id}
            onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))}
            required
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          >
            <option value="">Seleccionar…</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </RoomFormField>
        <div className="grid grid-cols-2 gap-3">
          <RoomFormField fieldKey="number" label="Número *" form={form} setForm={setForm} />
          <RoomFormField fieldKey="floor" label="Piso" type="number" form={form} setForm={setForm} />
        </div>
        <RoomFormField fieldKey="notes" label="Notas" form={form} setForm={setForm} />
        <label htmlFor={roomFieldId('is_active')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
          <input
            id={roomFieldId('is_active')}
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          />
          <span>Activa</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            {roomSaveLabel(saving)}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  )
}

interface MassPriceModalProps {
  readonly form: MassPriceForm
  readonly types: RoomType[]
  readonly pending: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<MassPriceForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function MassPriceModal({ form, types, pending, onClose, onChange, onSubmit }: MassPriceModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label="Actualizar precio por tipo"
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
      <form
        onSubmit={onSubmit}
        className="relative z-10 pointer-events-auto rounded-xl p-6 space-y-4 w-full max-w-sm"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Actualizar precio por tipo
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div>
          <label htmlFor="mass-price-room-type" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Tipo de habitación
          </label>
          <select
            id="mass-price-room-type"
            value={form.room_type_id}
            onChange={e => onChange({ room_type_id: e.target.value })}
            required
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          >
            <option value="">Seleccionar…</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} — {formatCOP(Number.parseFloat(t.base_price))}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mass-price-base" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Nuevo precio base (COP)
          </label>
          <input
            id="mass-price-base"
            type="number"
            value={form.base_price}
            onChange={e => onChange({ base_price: e.target.value })}
            required
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            {massPriceSaveLabel(pending)}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  )
}

interface RoomTableRowProps {
  readonly room: Room
  readonly onEdit: (room: Room) => void
  readonly onDelete: (room: Room) => void
}

function RoomTableRow({ room, onEdit, onDelete }: RoomTableRowProps) {
  const badgeStyle = statusBadgeStyle(room.status)

  return (
    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
      <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{room.number}</td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{room.room_type?.name ?? '—'}</td>
      <td className="py-2" style={{ color: 'var(--text-muted)' }}>{room.floor ?? '—'}</td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
        {room.room_type ? formatCOP(Number.parseFloat(room.room_type.base_price)) : '—'}
      </td>
      <td className="py-2">
        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={badgeStyle}>
          {STATUS_LABELS[room.status] ?? room.status}
        </span>
      </td>
      <td className="py-2">
        <span className="px-1.5 py-0.5 rounded text-xs" style={activeBadgeStyle(room.is_active)}>
          {activeBadgeLabel(room.is_active)}
        </span>
      </td>
      <td className="py-2">
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => onEdit(room)} aria-label={`Editar habitación ${room.number}`} style={{ color: 'var(--color-primary)' }}>
            <Pencil size={13} />
          </button>
          <button type="button" onClick={() => onDelete(room)} aria-label={`Desactivar habitación ${room.number}`} style={{ color: '#EF4444' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function HabitacionesTab() {
  const { data: rooms = [], isLoading } = useAdminRooms()
  const { create, update, remove } = useAdminRoomMutations()
  const { data: types = [] } = useAdminRoomTypes()
  const { massPrice } = useRoomTypeMutations()

  const [form, setForm] = useState<RoomForm>(EMPTY)
  const [editing, setEditing] = useState<Room | null>(null)
  const [open, setOpen] = useState(false)

  const [massPriceOpen, setMassPriceOpen] = useState(false)
  const [massPriceForm, setMassPriceForm] = useState<MassPriceForm>({ room_type_id: '', base_price: '' })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditing(room)
    setForm(roomToForm(room))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = buildRoomPayload(form)
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: { ...payload, is_active: form.is_active } })
    } else {
      await create.mutateAsync(payload)
    }
    close()
  }

  const del = (room: Room) => {
    if (confirm(`¿Desactivar habitación ${room.number}?`)) remove.mutate(room.id)
  }

  const submitMassPrice = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await massPrice.mutateAsync({
      room_type_id: massPriceForm.room_type_id,
      base_price: Number.parseFloat(massPriceForm.base_price),
    })
    setMassPriceOpen(false)
  }

  const roomSaving = create.isPending || update.isPending

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Habitaciones</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMassPriceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <DollarSign size={12} /> Actualizar precios
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={13} /> Nueva
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonText lines={4} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th className="text-left py-2 font-medium">Nro.</th>
                <th className="text-left py-2 font-medium">Tipo</th>
                <th className="text-left py-2 font-medium">Piso</th>
                <th className="text-left py-2 font-medium">Precio</th>
                <th className="text-left py-2 font-medium">Estado</th>
                <th className="text-left py-2 font-medium">Activa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <RoomTableRow key={room.id} room={room} onEdit={openEdit} onDelete={del} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <RoomFormModal
          editing={editing}
          form={form}
          types={types}
          saving={roomSaving}
          onClose={close}
          setForm={setForm}
          onSubmit={submit}
        />
      )}

      {massPriceOpen && (
        <MassPriceModal
          form={massPriceForm}
          types={types}
          pending={massPrice.isPending}
          onClose={() => setMassPriceOpen(false)}
          onChange={patch => setMassPriceForm(f => ({ ...f, ...patch }))}
          onSubmit={submitMassPrice}
        />
      )}
    </div>
  )
}
