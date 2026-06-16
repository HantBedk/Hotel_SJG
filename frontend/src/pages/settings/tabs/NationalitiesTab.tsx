import { useMemo, useState, type SubmitEvent } from 'react'
import { Globe, Hash, ListOrdered, Plus, Pencil, Search, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminNationalities, useNationalityMutations } from '@/hooks/useAdmin'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormField } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { SkeletonText } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { cn } from '@/lib/cn'
import type { Nationality } from '@/types/person'

type NationalityForm = {
  name: string
  iso_code: string
  sort_order: string
  is_active: boolean
}

type StatusFilter = 'all' | 'active' | 'inactive'

const EMPTY: NationalityForm = {
  name: '',
  iso_code: '',
  sort_order: '50',
  is_active: true,
}

const FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
]

function nationalityToForm(item: Nationality): NationalityForm {
  return {
    name: item.name,
    iso_code: item.iso_code ?? '',
    sort_order: String(item.sort_order ?? 50),
    is_active: item.is_active ?? true,
  }
}

function activeBadgeStyle(active: boolean): { background: string; color: string } {
  if (active) return { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function filterNationalities(
  items: Nationality[],
  search: string,
  status: StatusFilter,
): Nationality[] {
  const term = search.trim().toLowerCase()

  return items.filter((item) => {
    const active = item.is_active ?? true
    if (status === 'active' && !active) return false
    if (status === 'inactive' && active) return false
    if (!term) return true

    const haystack = [item.name, item.iso_code ?? '', String(item.sort_order ?? '')]
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })
}

interface NationalityFormModalProps {
  readonly open: boolean
  readonly editing: Nationality | null
  readonly form: NationalityForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<NationalityForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function NationalityFormModal({
  open,
  editing,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: NationalityFormModalProps) {
  const title = editing ? 'Editar nacionalidad' : 'Nueva nacionalidad'

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel={title}>
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

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
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
            <FormField id="nat-order" label="Orden" hint="Menor = primero en listados">
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

          <div
            className="rounded-xl px-4 py-3 border"
            style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}
          >
            <Checkbox
              id="nat-active"
              checked={form.is_active}
              onChange={(is_active) => onChange({ is_active })}
              label="Activa en listados"
            />
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

function NationalitiesLoadError() {
  return (
    <div
      className="rounded-xl py-8 px-4 text-center border"
      style={{ borderColor: '#FECACA', background: '#FEF2F2' }}
    >
      <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
        No se pudo cargar el catálogo
      </p>
      <p className="text-xs mt-1" style={{ color: '#B91C1C' }}>
        Verifica que tu usuario tenga permiso de configuración.
      </p>
    </div>
  )
}

interface NationalityRowProps {
  readonly item: Nationality
  readonly onEdit: (item: Nationality) => void
  readonly onDelete: (item: Nationality) => void
}

function NationalityRow({ item, onEdit, onDelete }: NationalityRowProps) {
  const active = item.is_active ?? true

  return (
    <tr
      className="group transition-colors hover:bg-[var(--bg-base)]"
      style={{ borderTop: '1px solid var(--border-default)' }}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-[140px]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {item.iso_code?.slice(0, 2) ?? <Globe size={15} aria-hidden="true" />}
          </div>
          <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {item.name}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        {item.iso_code ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <ListOrdered size={13} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          {item.sort_order ?? 50}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={activeBadgeStyle(active)}
        >
          {active ? 'Activa' : 'Inactiva'}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Editar ${item.name}`}
            className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Eliminar ${item.name}`}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            style={{ color: '#DC2626' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface NationalityMobileCardProps {
  readonly item: Nationality
  readonly onEdit: (item: Nationality) => void
  readonly onDelete: (item: Nationality) => void
}

function NationalityMobileCard({ item, onEdit, onDelete }: NationalityMobileCardProps) {
  const active = item.is_active ?? true

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {item.iso_code?.slice(0, 2) ?? <Globe size={16} aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {item.name}
            </p>
            <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-flex items-center gap-1">
                <Hash size={11} aria-hidden="true" />
                {item.iso_code ?? 'Sin ISO'}
              </span>
              <span>· Orden {item.sort_order ?? 50}</span>
            </p>
          </div>
        </div>
        <span
          className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={activeBadgeStyle(active)}
        >
          {active ? 'Activa' : 'Inactiva'}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex-1 py-2 rounded-lg text-xs font-medium border"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="flex-1 py-2 rounded-lg text-xs font-medium border"
          style={{ borderColor: '#FECACA', color: '#DC2626' }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

function NationalitiesEmptyState({ onCreate }: { readonly onCreate: () => void }) {
  return (
    <div
      className="rounded-xl py-12 px-6 text-center border border-dashed"
      style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
    >
      <Globe size={32} className="mx-auto mb-3 opacity-60" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Sin nacionalidades registradas
      </p>
      <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
        Define países para formularios de huéspedes, usuarios y check-in. Las en uso solo se desactivan al eliminar.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: 'var(--color-primary)' }}
      >
        <Plus size={14} />
        Crear primera nacionalidad
      </button>
    </div>
  )
}

interface NationalitiesListProps {
  readonly items: Nationality[]
  readonly onEdit: (item: Nationality) => void
  readonly onDelete: (item: Nationality) => void
}

function NationalitiesList({ items, onEdit, onDelete }: NationalitiesListProps) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
              <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">País</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">ISO</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Orden</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Estado</th>
              <th className="py-2.5 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <NationalityRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <NationalityMobileCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </>
  )
}

export default function NationalitiesTab() {
  const { data: items = [], isLoading, isError } = useAdminNationalities()
  const { create, update, remove } = useNationalityMutations()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [form, setForm] = useState<NationalityForm>(EMPTY)
  const [editing, setEditing] = useState<Nationality | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Nationality | null>(null)

  const activeCount = useMemo(
    () => items.filter((item) => item.is_active ?? true).length,
    [items],
  )

  const filteredItems = useMemo(
    () => filterNationalities(items, search, statusFilter),
    [items, search, statusFilter],
  )

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all'

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

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload })
        toast.success('Nacionalidad actualizada.')
      } else {
        await create.mutateAsync(payload)
        toast.success('Nacionalidad creada.')
      }
      close()
    } catch {
      toast.error('No se pudo guardar la nacionalidad.')
    }
  }

  const confirmDelete = (item: Nationality) => {
    remove.mutate(item.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        toast.success('Nacionalidad eliminada o desactivada.')
      },
      onError: () => toast.error('No se pudo eliminar. Puede estar en uso.'),
    })
  }

  const saving = create.isPending || update.isPending

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {isLoading ? (
            <span>Cargando catálogo…</span>
          ) : (
            <>
              <span className="font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {items.length} {items.length === 1 ? 'registro' : 'registros'}
              </span>
              <span className="opacity-40">·</span>
              <span>{activeCount} activas</span>
              <span className="opacity-40">·</span>
              <span>Huéspedes, usuarios y check-in</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white shrink-0 self-start sm:self-auto"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>

      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código ISO…"
              aria-label="Buscar nacionalidad"
              className={cn(personInputClass, 'pl-9 pr-8 py-2 text-sm')}
              style={personInputStyle}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.map(({ value, label }) => {
                const active = statusFilter === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                      active ? 'border-transparent' : 'hover:opacity-80',
                    )}
                    style={{
                      background: active ? 'var(--color-primary-light)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                      borderColor: active ? 'transparent' : 'var(--border-default)',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {filteredItems.length} / {items.length}
            </span>
          </div>
        </div>
      )}

      {isLoading && <SkeletonText lines={5} />}
      {isError && <NationalitiesLoadError />}

      {!isLoading && !isError && items.length === 0 && (
        <NationalitiesEmptyState onCreate={openCreate} />
      )}

      {!isLoading && !isError && items.length > 0 && filteredItems.length === 0 && (
        <div
          className="rounded-xl py-10 px-6 text-center border border-dashed"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
        >
          <Search size={28} className="mx-auto mb-2 opacity-50" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Sin resultados
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasFilters ? 'Prueba otro filtro o limpia la búsqueda.' : 'No hay registros que mostrar.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <NationalitiesList items={filteredItems} onEdit={openEdit} onDelete={setDeleteTarget} />
      )}

      <NationalityFormModal
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
        title="Eliminar nacionalidad"
        message={
          deleteTarget
            ? `¿Eliminar o desactivar ${deleteTarget.name}? Las en uso solo se desactivan.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
