import { useState } from 'react'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import { useAdminRooms, useAdminRoomMutations, useAdminRoomTypes, useRoomTypeMutations, useAdminHouses } from '@/hooks/useAdmin'
import type { Room, RoomType } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  available:   'Disponible',
  occupied:    'Ocupada',
  reserved:    'Reservada',
  cleaning:    'Limpieza',
  maintenance: 'Mantenimiento',
  blocked:     'Bloqueada',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  available:   { bg: '#D1FAE5', color: '#065F46' },
  occupied:    { bg: '#FEE2E2', color: '#991B1B' },
  reserved:    { bg: '#DBEAFE', color: '#1E40AF' },
  cleaning:    { bg: '#FEF3C7', color: '#92400E' },
  maintenance: { bg: '#F3E8FF', color: '#6B21A8' },
  blocked:     { bg: '#F3F4F6', color: '#374151' },
}

type RoomForm = {
  room_type_id: string
  house_id: string
  number: string
  floor: string
  notes: string
  is_active: boolean
}
const EMPTY: RoomForm = { room_type_id: '', house_id: '', number: '', floor: '', notes: '', is_active: true }

type MassPriceForm = { room_type_id: string; base_price: string }

export default function HabitacionesTab() {
  const { data: rooms = [], isLoading } = useAdminRooms()
  const { create, update, remove }      = useAdminRoomMutations()
  const { data: types = [] }            = useAdminRoomTypes()
  const { data: houses = [] }           = useAdminHouses()
  const { massPrice }                   = useRoomTypeMutations()

  const [form, setForm]       = useState<RoomForm>(EMPTY)
  const [editing, setEditing] = useState<Room | null>(null)
  const [open, setOpen]       = useState(false)

  const [massPriceOpen, setMassPriceOpen] = useState(false)
  const [massPriceForm, setMassPriceForm] = useState<MassPriceForm>({ room_type_id: '', base_price: '' })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (r: Room) => {
    setEditing(r)
    setForm({
      room_type_id: r.room_type_id,
      house_id:     r.house_id ?? '',
      number:       r.number,
      floor:        r.floor ? String(r.floor) : '',
      notes:        r.notes ?? '',
      is_active:    r.is_active,
    })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      house_id: form.house_id || null,
      floor:    form.floor ? parseInt(form.floor) : null,
    }
    if (editing) await update.mutateAsync({ id: editing.id, data: payload })
    else         await create.mutateAsync(payload as Parameters<typeof create.mutateAsync>[0])
    close()
  }

  const del = (r: Room) => {
    if (confirm(`¿Desactivar habitación ${r.number}?`)) remove.mutate(r.id)
  }

  const submitMassPrice = async (e: React.FormEvent) => {
    e.preventDefault()
    await massPrice.mutateAsync({ room_type_id: massPriceForm.room_type_id, base_price: parseFloat(massPriceForm.base_price) })
    setMassPriceOpen(false)
  }

  const F = ({ k, label, type = 'text', children }: { k: keyof RoomForm; label: string; type?: string; children?: React.ReactNode }) => (
    <div>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children ?? (
        <input
          type={type}
          value={String(form[k])}
          onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
          style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        />
      )}
    </div>
  )

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Habitaciones</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMassPriceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <DollarSign size={12} /> Actualizar precios
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={13} /> Nueva
          </button>
        </div>
      </div>

      {isLoading ? <SkeletonText lines={4} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th className="text-left py-2 font-medium">Nro.</th>
                <th className="text-left py-2 font-medium">Tipo</th>
                <th className="text-left py-2 font-medium">Casa</th>
                <th className="text-left py-2 font-medium">Piso</th>
                <th className="text-left py-2 font-medium">Precio</th>
                <th className="text-left py-2 font-medium">Estado</th>
                <th className="text-left py-2 font-medium">Activa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => {
                const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.blocked
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{r.number}</td>
                    <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{r.room_type?.name ?? '—'}</td>
                    <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{r.house?.name ?? '—'}</td>
                    <td className="py-2" style={{ color: 'var(--text-muted)' }}>{r.floor ?? '—'}</td>
                    <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                      {r.room_type ? formatCOP(parseFloat(r.room_type.base_price)) : '—'}
                    </td>
                    <td className="py-2">
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={sc}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ background: r.is_active ? '#D1FAE5' : '#FEE2E2', color: r.is_active ? '#065F46' : '#991B1B' }}
                      >
                        {r.is_active ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(r)} style={{ color: 'var(--color-primary)' }}><Pencil size={13} /></button>
                        <button onClick={() => del(r)} style={{ color: '#EF4444' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Room modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <form
            onSubmit={submit}
            className="rounded-xl p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing ? `Editar hab. ${editing.number}` : 'Nueva habitación'}
            </h3>
            <F k="room_type_id" label="Tipo de habitación *">
              <select
                value={form.room_type_id}
                onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                <option value="">Seleccionar…</option>
                {types.map((t: RoomType) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </F>
            <F k="house_id" label="Casa">
              <select
                value={form.house_id}
                onChange={e => setForm(f => ({ ...f, house_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                <option value="">Sin casa</option>
                {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F k="number" label="Número *" />
              <F k="floor" label="Piso" type="number" />
            </div>
            <F k="notes" label="Notas" />
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              Activa
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
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

      {/* Mass price modal */}
      {massPriceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <form
            onSubmit={submitMassPrice}
            className="rounded-xl p-6 space-y-4 w-full max-w-sm"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Actualizar precio por tipo
            </h3>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tipo de habitación</label>
              <select
                value={massPriceForm.room_type_id}
                onChange={e => setMassPriceForm(f => ({ ...f, room_type_id: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                <option value="">Seleccionar…</option>
                {types.map((t: RoomType) => <option key={t.id} value={t.id}>{t.name} — {formatCOP(parseFloat(t.base_price))}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nuevo precio base (COP)</label>
              <input
                type="number"
                value={massPriceForm.base_price}
                onChange={e => setMassPriceForm(f => ({ ...f, base_price: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={massPrice.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                {massPrice.isPending ? 'Actualizando…' : 'Actualizar'}
              </button>
              <button type="button" onClick={() => setMassPriceOpen(false)} className="px-4 py-2 rounded-lg text-sm border"
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
