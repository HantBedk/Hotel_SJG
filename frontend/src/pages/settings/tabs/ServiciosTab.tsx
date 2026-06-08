import { useState } from 'react'
import { Plus, Pencil, PowerOff } from 'lucide-react'
import { useAdminExtraServices, useExtraServiceMutations } from '@/hooks/useAdmin'
import type { ExtraService } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'

type ServiceForm = { name: string; price: string; description: string; active: boolean }
const EMPTY: ServiceForm = { name: '', price: '', description: '', active: true }

export default function ServiciosTab() {
  const { data: services = [], isLoading } = useAdminExtraServices()
  const { create, update }                 = useExtraServiceMutations()

  const [form, setForm]     = useState<ServiceForm>(EMPTY)
  const [editing, setEditing] = useState<ExtraService | null>(null)
  const [open, setOpen]     = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (s: ExtraService) => {
    setEditing(s)
    setForm({ name: s.name, price: s.price, description: s.description ?? '', active: s.active })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(form.price) }
    if (editing) await update.mutateAsync({ id: editing.id, data: payload })
    else         await create.mutateAsync(payload)
    close()
  }

  const toggleActive = (s: ExtraService) =>
    update.mutate({ id: s.id, data: { active: !s.active } })

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Servicios extra</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {isLoading ? <SkeletonText lines={3} /> : (
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
            {services.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td className="py-2" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{formatCOP(parseFloat(s.price))}</td>
                <td className="py-2" style={{ color: 'var(--text-muted)' }}>{s.description ?? '—'}</td>
                <td className="py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: s.active ? '#D1FAE5' : '#FEE2E2',
                      color:      s.active ? '#065F46' : '#991B1B',
                    }}
                  >
                    {s.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(s)} style={{ color: 'var(--color-primary)' }}>
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      title={s.active ? 'Desactivar' : 'Activar'}
                      style={{ color: s.active ? '#EF4444' : '#10B981' }}
                    >
                      <PowerOff size={13} />
                    </button>
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
              {editing ? 'Editar servicio' : 'Nuevo servicio'}
            </h3>
            {(['name', 'price', 'description'] as const).map(k => (
              <div key={k}>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  {k === 'name' ? 'Nombre' : k === 'price' ? 'Precio (COP)' : 'Descripción'}
                </label>
                <input
                  type={k === 'price' ? 'number' : 'text'}
                  value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  required={k !== 'description'}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Activo
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
