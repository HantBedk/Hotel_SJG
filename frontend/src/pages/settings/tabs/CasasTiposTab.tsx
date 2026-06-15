import { useState, useEffect, type SubmitEvent } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAdminRoomTypes, useRoomTypeMutations } from '@/hooks/useAdmin'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { RoomType } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/cn'

type RoomTypeForm = { name: string; description: string; base_price: string; max_occupancy: string; amenities: string }
const EMPTY_TYPE: RoomTypeForm = { name: '', description: '', base_price: '', max_occupancy: '2', amenities: '' }

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

function roomTypeFormTitle(editing: RoomType | null): string {
  if (editing) return 'Editar tipo'
  return 'Nuevo tipo'
}

function roomTypeSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Guardar'
}

interface RoomTypeFormModalProps {
  readonly editing: RoomType | null
  readonly form: RoomTypeForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<RoomTypeForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function RoomTypeFormModal({ editing, form, saving, onClose, onChange, onSubmit }: RoomTypeFormModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={roomTypeFormTitle(editing)}
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
        className="relative z-10 pointer-events-auto rounded-xl p-6 space-y-4 w-full max-w-md"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {roomTypeFormTitle(editing)}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div>
          <label htmlFor="room-type-name" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nombre</label>
          <input
            id="room-type-name"
            type="text"
            value={form.name}
            required
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <label htmlFor="room-type-description" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Descripción</label>
          <input
            id="room-type-description"
            type="text"
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="room-type-base-price" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Precio base (COP)</label>
            <input
              id="room-type-base-price"
              type="number"
              value={form.base_price}
              required
              onChange={(e) => onChange({ base_price: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
            />
          </div>
          <div>
            <label htmlFor="room-type-max-occupancy" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Capacidad máx.</label>
            <input
              id="room-type-max-occupancy"
              type="number"
              min={1}
              max={20}
              value={form.max_occupancy}
              required
              onChange={(e) => onChange({ max_occupancy: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="room-type-amenities" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Amenidades (separadas por coma)</label>
          <input
            id="room-type-amenities"
            type="text"
            value={form.amenities}
            placeholder="WiFi, TV, AC"
            onChange={(e) => onChange({ amenities: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            {roomTypeSaveLabel(saving)}
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

function RoomTypesSection() {
  const { data: types = [], isLoading } = useAdminRoomTypes()
  const { create, update, remove } = useRoomTypeMutations()

  const [form, setForm] = useState<RoomTypeForm>(EMPTY_TYPE)
  const [editing, setEditing] = useState<RoomType | null>(null)
  const [open, setOpen] = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY_TYPE); setOpen(true) }
  const openEdit = (t: RoomType) => {
    setEditing(t)
    setForm({
      name: t.name,
      description: t.description ?? '',
      base_price: t.base_price,
      max_occupancy: String(t.max_occupancy),
      amenities: (t.amenities ?? []).join(', '),
    })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload: Partial<RoomType> = {
      name: form.name,
      description: form.description || null,
      base_price: form.base_price,
      max_occupancy: Number.parseInt(form.max_occupancy, 10),
      amenities: form.amenities ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean) : null,
    }
    if (editing) await update.mutateAsync({ id: editing.id, data: payload })
    else await create.mutateAsync(payload)
    close()
  }

  const del = (t: RoomType) => {
    if (confirm(`¿Eliminar tipo "${t.name}"?`)) remove.mutate(t.id)
  }

  const saving = create.isPending || update.isPending

  let tableContent
  if (isLoading) {
    tableContent = <SkeletonText lines={2} />
  } else {
    tableContent = (
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <th className="text-left py-1.5 font-medium">Nombre</th>
            <th className="text-left py-1.5 font-medium">Precio base</th>
            <th className="text-left py-1.5 font-medium">Capacidad</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
              <td className="py-1.5" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
              <td className="py-1.5" style={{ color: 'var(--text-secondary)' }}>{formatCOP(Number.parseFloat(t.base_price))}</td>
              <td className="py-1.5" style={{ color: 'var(--text-secondary)' }}>{t.max_occupancy} pax</td>
              <td className="py-1.5">
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => openEdit(t)} style={{ color: 'var(--color-primary)' }} aria-label={`Editar ${t.name}`}>
                    <Pencil size={12} />
                  </button>
                  <button type="button" onClick={() => del(t)} style={{ color: '#EF4444' }} aria-label={`Eliminar ${t.name}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tipos de habitación</h3>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={12} /> Nuevo
        </button>
      </div>

      {tableContent}

      {open && (
        <RoomTypeFormModal
          editing={editing}
          form={form}
          saving={saving}
          onClose={close}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onSubmit={submit}
        />
      )}
    </div>
  )
}

export default function CasasTiposTab() {
  return (
    <div className="space-y-4">
      <RoomTypesSection />
    </div>
  )
}
