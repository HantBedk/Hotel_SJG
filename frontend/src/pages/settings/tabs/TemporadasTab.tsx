import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAdminSeasons, useSeasonMutations } from '@/hooks/useAdmin'
import type { Season } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'

type SeasonForm = {
  name: string
  start_date: string
  end_date: string
  multiplier: string
  active: boolean
}

const EMPTY: SeasonForm = { name: '', start_date: '', end_date: '', multiplier: '1', active: true }

export default function TemporadasTab() {
  const { data: seasons = [], isLoading } = useAdminSeasons()
  const { create, update, remove }        = useSeasonMutations()

  const [form, setForm]     = useState<SeasonForm>(EMPTY)
  const [editing, setEditing] = useState<Season | null>(null)
  const [open, setOpen]     = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (s: Season) => {
    setEditing(s)
    setForm({ name: s.name, start_date: s.start_date, end_date: s.end_date, multiplier: s.multiplier, active: s.active })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, multiplier: parseFloat(form.multiplier) } as unknown as Partial<Season>
    if (editing) await update.mutateAsync({ id: editing.id, data: payload })
    else         await create.mutateAsync(payload)
    close()
  }

  const del = async (s: Season) => {
    if (confirm(`¿Eliminar temporada "${s.name}"?`)) await remove.mutateAsync(s.id)
  }

  const field = (key: keyof SeasonForm, label: string, type = 'text') => (
    <div>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        required={key !== 'active'}
        className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
      />
    </div>
  )

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Temporadas</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Nueva
        </button>
      </div>

      {isLoading ? <SkeletonText lines={3} /> : (
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
            {seasons.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td className="py-2" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{s.start_date}</td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{s.end_date}</td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>×{s.multiplier}</td>
                <td className="py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: s.active ? '#D1FAE5' : '#FEE2E2',
                      color:      s.active ? '#065F46' : '#991B1B',
                    }}
                  >
                    {s.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(s)} style={{ color: 'var(--color-primary)' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => del(s)} style={{ color: '#EF4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <form
            onSubmit={submit}
            className="rounded-xl p-6 space-y-4 w-full max-w-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing ? 'Editar temporada' : 'Nueva temporada'}
            </h3>
            {field('name', 'Nombre')}
            {field('start_date', 'Fecha inicio', 'date')}
            {field('end_date', 'Fecha fin', 'date')}
            {field('multiplier', 'Multiplicador (ej: 1.2)', 'number')}
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              />
              Activa
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                {(create.isPending || update.isPending) ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
