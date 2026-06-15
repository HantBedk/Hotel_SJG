import { useState, type SubmitEvent } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAdminNationalities, useNationalityMutations } from '@/hooks/useAdmin'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormField } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { SkeletonText } from '@/components/ui/Skeleton'
import type { Nationality } from '@/types/person'

type NationalityForm = {
  name: string
  iso_code: string
  sort_order: string
  is_active: boolean
}

const EMPTY: NationalityForm = {
  name: '',
  iso_code: '',
  sort_order: '50',
  is_active: true,
}

function nationalityToForm(item: Nationality): NationalityForm {
  return {
    name: item.name,
    iso_code: item.iso_code ?? '',
    sort_order: String(item.sort_order ?? 50),
    is_active: item.is_active ?? true,
  }
}

function activeBadgeStyle(active: boolean): { background: string; color: string } {
  if (active) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

interface NationalityFormModalProps {
  readonly editing: Nationality | null
  readonly form: NationalityForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<NationalityForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function NationalityFormModal({
  editing, form, saving, onClose, onChange, onSubmit,
}: NationalityFormModalProps) {
  const title = editing ? 'Editar nacionalidad' : 'Nueva nacionalidad'

  return (
    <Modal open onClose={onClose} size="md" ariaLabel={title}>
      <form onSubmit={onSubmit} className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
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

        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <FormField id="nat-name" label="Nombre" required>
            <input
              id="nat-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={personInputClass}
              style={personInputStyle}
              placeholder="Ej. Colombia"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="nat-iso" label="Código ISO" hint="2 letras, opcional">
              <input
                id="nat-iso"
                type="text"
                maxLength={2}
                value={form.iso_code}
                onChange={(e) => onChange({ iso_code: e.target.value.toUpperCase() })}
                className={personInputClass}
                style={personInputStyle}
                placeholder="CO"
              />
            </FormField>
            <FormField id="nat-order" label="Orden">
              <input
                id="nat-order"
                type="number"
                min={0}
                max={9999}
                value={form.sort_order}
                onChange={(e) => onChange({ sort_order: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
          </div>

          <Checkbox
            id="nat-active"
            checked={form.is_active}
            onChange={(is_active) => onChange({ is_active })}
            label="Activa en listados"
          />
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

function NationalitiesLoadError() {
  return (
    <p className="text-sm rounded-lg border px-3 py-2" style={{ color: '#991B1B', borderColor: '#FECACA', background: '#FEF2F2' }}>
      No se pudo cargar el catálogo de nacionalidades. Verifica que tu usuario tenga permiso de configuración.
    </p>
  )
}

interface NationalitiesTableProps {
  readonly items: Nationality[]
  readonly onEdit: (item: Nationality) => void
  readonly onDelete: (item: Nationality) => void
}

function NationalitiesTable({ items, onEdit, onDelete }: NationalitiesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            <th className="text-left py-2 px-3 font-medium">Nombre</th>
            <th className="text-left py-2 px-3 font-medium">ISO</th>
            <th className="text-left py-2 px-3 font-medium">Orden</th>
            <th className="text-left py-2 px-3 font-medium">Estado</th>
            <th className="py-2 px-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderTop: '1px solid var(--border-default)' }}>
              <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
              <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{item.iso_code ?? '—'}</td>
              <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{item.sort_order ?? 50}</td>
              <td className="py-2 px-3">
                <span className="px-1.5 py-0.5 rounded text-xs" style={activeBadgeStyle(item.is_active ?? true)}>
                  {(item.is_active ?? true) ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="py-2 px-3">
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => onEdit(item)} aria-label={`Editar ${item.name}`} style={{ color: 'var(--color-primary)' }}>
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => onDelete(item)} aria-label={`Eliminar ${item.name}`} style={{ color: '#EF4444' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderNationalitiesBody(
  isLoading: boolean,
  isError: boolean,
  items: Nationality[],
  onEdit: (item: Nationality) => void,
  onDelete: (item: Nationality) => void,
) {
  if (isLoading) return <SkeletonText lines={4} />
  if (isError) return <NationalitiesLoadError />
  return <NationalitiesTable items={items} onEdit={onEdit} onDelete={onDelete} />
}

export default function NationalitiesTab() {
  const { data: items = [], isLoading, isError } = useAdminNationalities()
  const { create, update, remove } = useNationalityMutations()

  const [form, setForm] = useState<NationalityForm>(EMPTY)
  const [editing, setEditing] = useState<Nationality | null>(null)
  const [open, setOpen] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (item: Nationality) => {
    setEditing(item)
    setForm(nationalityToForm(item))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      iso_code: form.iso_code.trim() || null,
      sort_order: Number(form.sort_order) || 50,
      is_active: form.is_active,
    }
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    close()
  }

  const handleDelete = (item: Nationality) => {
    if (!confirm(`¿Eliminar o desactivar "${item.name}"?`)) return
    remove.mutate(item.id)
  }

  const saving = create.isPending || update.isPending

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Catálogo usado en huéspedes, usuarios y check-in. Las en uso solo se desactivan.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Agregar
        </button>
      </div>

      {renderNationalitiesBody(isLoading, isError, items, openEdit, handleDelete)}

      {open && (
        <NationalityFormModal
          editing={editing}
          form={form}
          saving={saving}
          onClose={close}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onSubmit={submit}
        />
      )}
    </>
  )
}
