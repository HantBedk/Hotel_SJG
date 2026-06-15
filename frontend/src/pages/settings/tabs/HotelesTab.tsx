import { useState, useEffect, type SubmitEvent } from 'react'
import { Plus, Pencil, Trash2, Building2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createHotelApi,
  deleteHotelApi,
  getAdminHotelsApi,
  updateHotelApi,
} from '@/services/admin.service'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import { useAuth } from '@/hooks/useAuth'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useHotelStore } from '@/store/hotelStore'
import type { HotelSummary } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

type HotelForm = {
  name: string
  nit: string
  address: string
  phone: string
  email: string
  city: string
  country: string
}

type AdminHotelDetail = HotelSummary & Partial<HotelForm>

const FORM_FIELDS = ['name', 'nit', 'city', 'address', 'phone', 'email'] as const
type FormFieldKey = (typeof FORM_FIELDS)[number]

const FIELD_LABELS: Record<FormFieldKey, string> = {
  name: 'Nombre',
  nit: 'NIT',
  city: 'Ciudad',
  address: 'Dirección',
  phone: 'Teléfono',
  email: 'Correo electrónico',
}

const EMPTY: HotelForm = {
  name: '',
  nit: '',
  address: '',
  phone: '',
  email: '',
  city: '',
  country: 'CO',
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

function hotelFieldId(field: FormFieldKey): string {
  return `hotel-field-${field}`
}

function hotelFormTitle(editing: HotelSummary | null): string {
  if (editing) return 'Editar hotel'
  return 'Nuevo hotel'
}

function hotelSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Guardar'
}

function hotelToForm(hotel: HotelSummary): HotelForm {
  const detail = hotel as AdminHotelDetail
  return {
    name: detail.name ?? '',
    nit: detail.nit ?? '',
    address: detail.address ?? '',
    phone: detail.phone ?? '',
    email: detail.email ?? '',
    city: detail.city ?? '',
    country: detail.country ?? 'CO',
  }
}

function hotelCardBorderColor(isActive: boolean): string {
  if (isActive) return 'var(--color-primary)'
  return 'var(--border-default)'
}

interface HotelFormModalProps {
  readonly editing: HotelSummary | null
  readonly form: HotelForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (field: FormFieldKey, value: string) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function HotelFormModal({ editing, form, saving, onClose, onChange, onSubmit }: HotelFormModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={hotelFormTitle(editing)}
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
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-xl p-6 space-y-3 border shadow-xl"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {hotelFormTitle(editing)}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        {FORM_FIELDS.map(field => (
          <div key={field}>
            <label htmlFor={hotelFieldId(field)} className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
              {FIELD_LABELS[field]}
            </label>
            <input
              id={hotelFieldId(field)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
              value={form[field]}
              onChange={e => onChange(field, e.target.value)}
              required={field === 'name' || field === 'nit'}
            />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 text-sm rounded-lg text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {hotelSaveLabel(saving)}
          </button>
        </div>
      </form>
    </dialog>
  )
}

interface HotelCardProps {
  readonly hotel: HotelSummary
  readonly isActive: boolean
  readonly canDelete: boolean
  readonly onEdit: (hotel: HotelSummary) => void
  readonly onDelete: (hotel: HotelSummary) => void
}

function HotelCard({ hotel, isActive, canDelete, onEdit, onDelete }: HotelCardProps) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border"
      style={{
        borderColor: hotelCardBorderColor(isActive),
        background: 'var(--bg-surface)',
      }}
    >
      <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {hotel.name}
          {isActive && (
            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-primary)' }}>
              (activo)
            </span>
          )}
        </p>
        <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
          {hotel.city ?? '—'}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onEdit(hotel)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={`Editar ${hotel.name}`}
        >
          <Pencil size={16} />
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(hotel)}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            aria-label={`Eliminar ${hotel.name}`}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function HotelesTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_hotels')
  const qc = useQueryClient()
  const currentHotelId = useHotelStore(s => s.currentHotelId)

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: hotelQueryKey('admin', 'hotels'),
    queryFn: getAdminHotelsApi,
  })

  const [form, setForm] = useState<HotelForm>(EMPTY)
  const [editing, setEditing] = useState<HotelSummary | null>(null)
  const [open, setOpen] = useState(false)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'hotels') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'hotel') })
  }

  const createMut = useMutation({
    mutationFn: createHotelApi,
    onSuccess: () => { toast.success('Hotel creado.'); invalidate(); setOpen(false) },
    onError: () => toast.error('No se pudo crear el hotel.'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateHotelApi(id, data),
    onSuccess: () => { toast.success('Hotel actualizado.'); invalidate(); setOpen(false) },
    onError: () => toast.error('No se pudo actualizar.'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteHotelApi,
    onSuccess: () => { toast.success('Hotel eliminado.'); invalidate() },
    onError: () => toast.error('No se pudo eliminar.'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (hotel: HotelSummary) => {
    setEditing(hotel)
    setForm(hotelToForm(hotel))
    setOpen(true)
  }

  const handleDelete = (hotel: HotelSummary) => {
    if (confirm(`¿Eliminar "${hotel.name}"?`)) deleteMut.mutate(hotel.id)
  }

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  const handleFieldChange = (field: FormFieldKey, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  if (isLoading) return <SkeletonText lines={6} />

  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Establecimientos
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Hoteles a los que tienes acceso. El hotel activo se cambia desde el encabezado.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} /> Nuevo hotel
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {hotels.map(hotel => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            isActive={hotel.id === currentHotelId}
            canDelete={canManage && hotels.length > 1}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {open && (
        <HotelFormModal
          editing={editing}
          form={form}
          saving={saving}
          onClose={() => setOpen(false)}
          onChange={handleFieldChange}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
