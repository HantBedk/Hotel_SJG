import { useState, type SubmitEvent } from 'react'
import { BedDouble, Layers, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminRoomTypes, useRoomTypeMutations } from '@/hooks/useAdmin'
import { FormField } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { SkeletonText } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { RoomType } from '@/types'

type RoomTypeForm = {
  name: string
  base_price: string
  max_occupancy: string
}

const EMPTY_TYPE: RoomTypeForm = {
  name: '',
  base_price: '',
  max_occupancy: '2',
}

function roomTypeToForm(type: RoomType): RoomTypeForm {
  return {
    name: type.name,
    base_price: type.base_price,
    max_occupancy: String(type.max_occupancy),
  }
}

function roomTypeModalTitle(editing: RoomType | null): string {
  if (editing) return 'Editar tipo de habitación'
  return 'Nuevo tipo de habitación'
}

interface RoomTypeFormModalProps {
  readonly open: boolean
  readonly editing: RoomType | null
  readonly form: RoomTypeForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<RoomTypeForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function RoomTypeFormModal({
  open,
  editing,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: RoomTypeFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" ariaLabel={roomTypeModalTitle(editing)}>
      <form onSubmit={onSubmit} className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {roomTypeModalTitle(editing)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <FormField id="room-type-name" label="Nombre" required>
            <input
              id="room-type-name"
              type="text"
              required
              value={form.name}
              placeholder="Ej. Estándar, Suite, Familiar"
              onChange={(e) => onChange({ name: e.target.value })}
              className={personInputClass}
              style={personInputStyle}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="room-type-base-price" label="Precio base (COP)" required>
              <input
                id="room-type-base-price"
                type="number"
                min={0}
                step={1000}
                required
                value={form.base_price}
                onChange={(e) => onChange({ base_price: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
            <FormField id="room-type-max-occupancy" label="Capacidad máx." required hint="Personas">
              <input
                id="room-type-max-occupancy"
                type="number"
                min={1}
                max={20}
                required
                value={form.max_occupancy}
                onChange={(e) => onChange({ max_occupancy: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm border disabled:opacity-60"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

interface RoomTypeRowProps {
  readonly type: RoomType
  readonly onEdit: (type: RoomType) => void
  readonly onDelete: (type: RoomType) => void
}

function RoomTypeRow({ type, onEdit, onDelete }: RoomTypeRowProps) {
  const price = Number.parseFloat(type.base_price)

  return (
    <tr
      className="group transition-colors hover:bg-[var(--bg-base)]"
      style={{ borderTop: '1px solid var(--border-default)' }}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-[160px]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <BedDouble size={16} aria-hidden="true" />
          </div>
          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {type.name}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        {Number.isNaN(price) ? '—' : formatCOP(price)}
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} style={{ color: 'var(--text-muted)' }} />
          {type.max_occupancy} pers.
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(type)}
            aria-label={`Editar ${type.name}`}
            className="compact-control p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(type)}
            aria-label={`Eliminar ${type.name}`}
            className="compact-control p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            style={{ color: '#DC2626' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface RoomTypeMobileCardProps {
  readonly type: RoomType
  readonly onEdit: (type: RoomType) => void
  readonly onDelete: (type: RoomType) => void
}

function RoomTypeMobileCard({ type, onEdit, onDelete }: RoomTypeMobileCardProps) {
  const price = Number.parseFloat(type.base_price)

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <BedDouble size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {type.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {type.max_occupancy} personas
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
          {Number.isNaN(price) ? '—' : formatCOP(price)}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(type)}
          className="flex-1 py-2 rounded-lg text-xs font-medium border"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(type)}
          className="flex-1 py-2 rounded-lg text-xs font-medium border"
          style={{ borderColor: '#FECACA', color: '#DC2626' }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

function RoomTypesEmptyState({ onCreate }: { readonly onCreate: () => void }) {
  return (
    <div
      className="rounded-xl py-12 px-6 text-center"
      style={{ background: 'var(--bg-muted)', border: '1px dashed var(--border-default)' }}
    >
      <Layers size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Sin tipos de habitación
      </p>
      <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
        Define categorías como Estándar o Suite con precio base y capacidad para asignarlas al catálogo de habitaciones.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: 'var(--color-primary)' }}
      >
        <Plus size={14} />
        Crear primer tipo
      </button>
    </div>
  )
}

export default function CasasTiposTab() {
  const { data: types = [], isLoading } = useAdminRoomTypes()
  const { create, update, remove } = useRoomTypeMutations()

  const [form, setForm] = useState<RoomTypeForm>(EMPTY_TYPE)
  const [editing, setEditing] = useState<RoomType | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_TYPE)
    setOpen(true)
  }

  const openEdit = (type: RoomType) => {
    setEditing(type)
    setForm(roomTypeToForm(type))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload: Partial<RoomType> = {
      name: form.name.trim(),
      base_price: form.base_price,
      max_occupancy: Number.parseInt(form.max_occupancy, 10),
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload })
        toast.success('Tipo de habitación actualizado.')
      } else {
        await create.mutateAsync(payload)
        toast.success('Tipo de habitación creado.')
      }
      close()
    } catch {
      toast.error('No se pudo guardar el tipo de habitación.')
    }
  }

  const confirmDelete = (type: RoomType) => {
    remove.mutate(type.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        toast.success('Tipo de habitación eliminado.')
      },
      onError: () => toast.error('No se pudo eliminar. Puede estar en uso.'),
    })
  }

  const saving = create.isPending || update.isPending

  return (
    <div className="space-y-5 max-w-4xl pb-4">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tipos de habitación
          </h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--text-muted)' }}>
            Categorías con precio base y capacidad. Se usan al crear habitaciones en el catálogo y en tarifas.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={15} />
          Nuevo tipo
        </button>
      </header>

      <section
        className={cn(
          'rounded-xl shadow-sm flex flex-col min-h-0',
          isLoading && 'opacity-80',
        )}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers size={16} style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              Catálogo de tipos
            </span>
          </div>
          {!isLoading && (
            <span
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              {types.length} {types.length === 1 ? 'tipo' : 'tipos'}
            </span>
          )}
        </div>

        <div className="p-4">
          {isLoading && <SkeletonText lines={4} />}

          {!isLoading && types.length === 0 && (
            <RoomTypesEmptyState onCreate={openCreate} />
          )}

          {!isLoading && types.length > 0 && (
            <>
              <div className="hidden md:block overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Tipo</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Precio base</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Capacidad</th>
                      <th className="py-2.5 px-4 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((type) => (
                      <RoomTypeRow
                        key={type.id}
                        type={type}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {types.map((type) => (
                  <RoomTypeMobileCard
                    key={type.id}
                    type={type}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <RoomTypeFormModal
        open={open}
        editing={editing}
        form={form}
        saving={saving}
        onClose={close}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        target={deleteTarget}
        title="Eliminar tipo de habitación"
        message={
          deleteTarget
            ? `¿Eliminar ${deleteTarget.name}? No podrás usarlo en habitaciones nuevas.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
