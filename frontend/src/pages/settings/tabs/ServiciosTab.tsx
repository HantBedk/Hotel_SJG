import { useState, useEffect, type SubmitEvent, type Dispatch, type SetStateAction } from 'react'
import { Plus, Pencil, PowerOff, X } from 'lucide-react'
import { useAdminExtraServices, useExtraServiceMutations } from '@/hooks/useAdmin'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { ExtraService } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/cn'

type ServiceForm = {
  name: string
  price: string
  description: string
  active: boolean
}

const FORM_FIELDS = ['name', 'price', 'description'] as const
type ServiceFormField = (typeof FORM_FIELDS)[number]

const EMPTY: ServiceForm = { name: '', price: '', description: '', active: true }

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

function serviceFieldId(field: ServiceFormField | 'active'): string {
  return `service-field-${field}`
}

function serviceFieldLabel(field: ServiceFormField): string {
  if (field === 'name') return 'Nombre'
  if (field === 'price') return 'Precio (COP)'
  return 'Descripción'
}

function serviceFieldType(field: ServiceFormField): string {
  if (field === 'price') return 'number'
  return 'text'
}

function serviceFormTitle(editing: ExtraService | null): string {
  if (editing) return 'Editar servicio'
  return 'Nuevo servicio'
}

function serviceSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Guardar'
}

function activeBadgeStyle(active: boolean): { background: string; color: string } {
  if (active) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function activeBadgeLabel(active: boolean): string {
  if (active) return 'Activo'
  return 'Inactivo'
}

function toggleActiveTitle(active: boolean): string {
  if (active) return 'Desactivar'
  return 'Activar'
}

function toggleActiveColor(active: boolean): string {
  if (active) return '#EF4444'
  return '#10B981'
}

function serviceToForm(service: ExtraService): ServiceForm {
  return {
    name: service.name,
    price: service.price,
    description: service.description ?? '',
    active: service.active,
  }
}

function buildServicePayload(form: ServiceForm) {
  return {
    ...form,
    price: Number.parseFloat(form.price),
  }
}

interface ServiceFormModalProps {
  readonly editing: ExtraService | null
  readonly form: ServiceForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly setForm: Dispatch<SetStateAction<ServiceForm>>
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function ServiceFormModal({ editing, form, saving, onClose, setForm, onSubmit }: ServiceFormModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={serviceFormTitle(editing)}
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
            {serviceFormTitle(editing)}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        {FORM_FIELDS.map(field => (
          <div key={field}>
            <label htmlFor={serviceFieldId(field)} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              {serviceFieldLabel(field)}
            </label>
            <input
              id={serviceFieldId(field)}
              type={serviceFieldType(field)}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              required={field !== 'description'}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
            />
          </div>
        ))}
        <label htmlFor={serviceFieldId('active')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
          <input
            id={serviceFieldId('active')}
            type="checkbox"
            checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          />
          <span>Activo</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {serviceSaveLabel(saving)}
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

interface ServiceTableRowProps {
  readonly service: ExtraService
  readonly onEdit: (service: ExtraService) => void
  readonly onToggleActive: (service: ExtraService) => void
}

function ServiceTableRow({ service, onEdit, onToggleActive }: ServiceTableRowProps) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
      <td className="py-2" style={{ color: 'var(--text-primary)' }}>{service.name}</td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
        {formatCOP(Number.parseFloat(service.price))}
      </td>
      <td className="py-2" style={{ color: 'var(--text-muted)' }}>{service.description ?? '—'}</td>
      <td className="py-2">
        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={activeBadgeStyle(service.active)}>
          {activeBadgeLabel(service.active)}
        </span>
      </td>
      <td className="py-2">
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => onEdit(service)}
            aria-label={`Editar ${service.name}`}
            style={{ color: 'var(--color-primary)' }}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onToggleActive(service)}
            title={toggleActiveTitle(service.active)}
            aria-label={toggleActiveTitle(service.active)}
            style={{ color: toggleActiveColor(service.active) }}
          >
            <PowerOff size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ServiciosTab() {
  const { data: services = [], isLoading } = useAdminExtraServices()
  const { create, update } = useExtraServiceMutations()

  const [form, setForm] = useState<ServiceForm>(EMPTY)
  const [editing, setEditing] = useState<ExtraService | null>(null)
  const [open, setOpen] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (service: ExtraService) => {
    setEditing(service)
    setForm(serviceToForm(service))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = buildServicePayload(form)
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    close()
  }

  const toggleActive = (service: ExtraService) => {
    update.mutate({ id: service.id, data: { active: !service.active } })
  }

  const saving = create.isPending || update.isPending

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Servicios extra</h2>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {isLoading ? (
        <SkeletonText lines={3} />
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th className="text-left py-2 font-medium">Nombre</th>
              <th className="text-left py-2 font-medium">Precio</th>
              <th className="text-left py-2 font-medium">Descripción</th>
              <th className="text-left py-2 font-medium">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <ServiceTableRow
                key={service.id}
                service={service}
                onEdit={openEdit}
                onToggleActive={toggleActive}
              />
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <ServiceFormModal
          editing={editing}
          form={form}
          saving={saving}
          onClose={close}
          setForm={setForm}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
