import { useState, useEffect, type SubmitEvent } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAdminSeasons, useSeasonMutations } from '@/hooks/useAdmin'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { Season } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

type SeasonForm = {
  name: string
  start_date: string
  end_date: string
  multiplier: string
  active: boolean
}

type SeasonFormField = 'name' | 'start_date' | 'end_date' | 'multiplier'

const FIELD_CONFIG: ReadonlyArray<{ readonly key: SeasonFormField; readonly label: string; readonly type: string }> = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'start_date', label: 'Fecha inicio', type: 'date' },
  { key: 'end_date', label: 'Fecha fin', type: 'date' },
  { key: 'multiplier', label: 'Multiplicador (ej: 1.2)', type: 'number' },
]

const EMPTY: SeasonForm = { name: '', start_date: '', end_date: '', multiplier: '1', active: true }

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

function seasonFieldId(field: SeasonFormField | 'active'): string {
  return `season-field-${field}`
}

function seasonFormTitle(editing: Season | null): string {
  if (editing) return 'Editar temporada'
  return 'Nueva temporada'
}

function seasonSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Guardar'
}

function activeBadgeStyle(active: boolean): { background: string; color: string } {
  if (active) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function activeBadgeLabel(active: boolean): string {
  if (active) return 'Activa'
  return 'Inactiva'
}

function seasonToForm(season: Season): SeasonForm {
  return {
    name: season.name,
    start_date: season.start_date,
    end_date: season.end_date,
    multiplier: season.multiplier,
    active: season.active,
  }
}

function buildSeasonPayload(form: SeasonForm): Partial<Season> {
  return {
    name: form.name,
    start_date: form.start_date,
    end_date: form.end_date,
    multiplier: String(Number.parseFloat(form.multiplier)),
    active: form.active,
  }
}

interface SeasonFormFieldInputProps {
  readonly fieldKey: SeasonFormField
  readonly label: string
  readonly type: string
  readonly value: string
  readonly onChange: (field: SeasonFormField, value: string) => void
}

function SeasonFormFieldInput({ fieldKey, label, type, value, onChange }: SeasonFormFieldInputProps) {
  const inputId = seasonFieldId(fieldKey)

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={e => onChange(fieldKey, e.target.value)}
        required
        className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
      />
    </div>
  )
}

interface SeasonFormModalProps {
  readonly editing: Season | null
  readonly form: SeasonForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onFieldChange: (field: SeasonFormField, value: string) => void
  readonly onActiveChange: (active: boolean) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function SeasonFormModal({
  editing, form, saving, onClose, onFieldChange, onActiveChange, onSubmit,
}: SeasonFormModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={seasonFormTitle(editing)}
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
            {seasonFormTitle(editing)}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        {FIELD_CONFIG.map(({ key, label, type }) => (
          <SeasonFormFieldInput
            key={key}
            fieldKey={key}
            label={label}
            type={type}
            value={form[key]}
            onChange={onFieldChange}
          />
        ))}
        <label htmlFor={seasonFieldId('active')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
          <input
            id={seasonFieldId('active')}
            type="checkbox"
            checked={form.active}
            onChange={e => onActiveChange(e.target.checked)}
          />
          <span>Activa</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {seasonSaveLabel(saving)}
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

interface SeasonTableRowProps {
  readonly season: Season
  readonly onEdit: (season: Season) => void
  readonly onDelete: (season: Season) => void
}

function SeasonTableRow({ season, onEdit, onDelete }: SeasonTableRowProps) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
      <td className="py-2" style={{ color: 'var(--text-primary)' }}>{season.name}</td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{season.start_date}</td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{season.end_date}</td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>×{season.multiplier}</td>
      <td className="py-2">
        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={activeBadgeStyle(season.active)}>
          {activeBadgeLabel(season.active)}
        </span>
      </td>
      <td className="py-2">
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => onEdit(season)}
            aria-label={`Editar ${season.name}`}
            style={{ color: 'var(--color-primary)' }}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(season)}
            aria-label={`Eliminar ${season.name}`}
            style={{ color: '#EF4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function TemporadasTab() {
  const { data: seasons = [], isLoading } = useAdminSeasons()
  const { create, update, remove } = useSeasonMutations()

  const [form, setForm] = useState<SeasonForm>(EMPTY)
  const [editing, setEditing] = useState<Season | null>(null)
  const [open, setOpen] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (season: Season) => {
    setEditing(season)
    setForm(seasonToForm(season))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = buildSeasonPayload(form)
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    close()
  }

  const del = async (season: Season) => {
    if (confirm(`¿Eliminar temporada "${season.name}"?`)) {
      await remove.mutateAsync(season.id)
    }
  }

  const handleFieldChange = (field: SeasonFormField, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const saving = create.isPending || update.isPending

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Temporadas</h2>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Nueva
        </button>
      </div>

      {isLoading ? (
        <SkeletonText lines={3} />
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th className="text-left py-2 font-medium">Nombre</th>
              <th className="text-left py-2 font-medium">Inicio</th>
              <th className="text-left py-2 font-medium">Fin</th>
              <th className="text-left py-2 font-medium">Multiplicador</th>
              <th className="text-left py-2 font-medium">Activa</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {seasons.map(season => (
              <SeasonTableRow key={season.id} season={season} onEdit={openEdit} onDelete={del} />
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <SeasonFormModal
          editing={editing}
          form={form}
          saving={saving}
          onClose={close}
          onFieldChange={handleFieldChange}
          onActiveChange={active => setForm(f => ({ ...f, active }))}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
