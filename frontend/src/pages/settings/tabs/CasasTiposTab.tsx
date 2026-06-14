import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAdminRoomTypes, useRoomTypeMutations } from '@/hooks/useAdmin'
import type { RoomType } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'

// ── Room Types ────────────────────────────────────────────────────────────────

type RoomTypeForm = { name: string; description: string; base_price: string; max_occupancy: string; amenities: string }
const EMPTY_TYPE: RoomTypeForm = { name: '', description: '', base_price: '', max_occupancy: '2', amenities: '' }

function RoomTypesSection() {
  const { data: types = [], isLoading } = useAdminRoomTypes()
  const { create, update, remove }      = useRoomTypeMutations()

  const [form, setForm]       = useState<RoomTypeForm>(EMPTY_TYPE)
  const [editing, setEditing] = useState<RoomType | null>(null)
  const [open, setOpen]       = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY_TYPE); setOpen(true) }
  const openEdit   = (t: RoomType) => {
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Partial<RoomType> = {
      name: form.name,
      description: form.description || null,
      base_price: form.base_price,
      max_occupancy: parseInt(form.max_occupancy),
      amenities: form.amenities ? form.amenities.split(',').map(s => s.trim()).filter(Boolean) : null,
    }
    if (editing) await update.mutateAsync({ id: editing.id, data: payload })
    else         await create.mutateAsync(payload)
    close()
  }

  const del = (t: RoomType) => {
    if (confirm(`¿Eliminar tipo "${t.name}"?`)) remove.mutate(t.id)
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tipos de habitación</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={12} /> Nuevo
        </button>
      </div>

      {isLoading ? <SkeletonText lines={2} /> : (
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
            {types.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td className="py-1.5" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                <td className="py-1.5" style={{ color: 'var(--text-secondary)' }}>{formatCOP(parseFloat(t.base_price))}</td>
                <td className="py-1.5" style={{ color: 'var(--text-secondary)' }}>{t.max_occupancy} pax</td>
                <td className="py-1.5">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(t)} style={{ color: 'var(--color-primary)' }}><Pencil size={12} /></button>
                    <button onClick={() => del(t)} style={{ color: '#EF4444' }}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <form
            onSubmit={submit}
            className="rounded-xl p-6 space-y-4 w-full max-w-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing ? 'Editar tipo' : 'Nuevo tipo'}
            </h3>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nombre</label>
              <input type="text" value={form.name} required onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Descripción</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Precio base (COP)</label>
                <input type="number" value={form.base_price} required onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Capacidad máx.</label>
                <input type="number" min={1} max={20} value={form.max_occupancy} required onChange={e => setForm(f => ({ ...f, max_occupancy: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Amenidades (separadas por coma)</label>
              <input type="text" value={form.amenities} placeholder="WiFi, TV, AC" onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={create.isPending || update.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--color-primary)' }}>
                {(create.isPending || update.isPending) ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={close} className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
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
