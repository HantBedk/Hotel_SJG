import { useState } from 'react'
import { Plus, Pencil, Trash2, X, RefreshCw, Clock, BedDouble, ChevronRight } from 'lucide-react'
import {
  useMinibarProducts,
  useMinibarProductMutations,
  useRoomMinibars,
  useMinibars,
  useMinibarMutations,
} from '@/hooks/useInventory'
import { useRooms } from '@/hooks/useRooms'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { Minibar, MinibarProduct, Room } from '@/types'

function formatCurrency(v: string | number | null) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

// ── Product form ──────────────────────────────────────────────────────────────
interface ProductFormData {
  code: string
  name: string
  presentation: string
  sale_price: string
  cost_price: string
  damage_price: string
  stock_quantity: string
  expiration_date: string
  has_expiration: boolean
  description: string
}

interface ProductFormProps {
  product?: MinibarProduct | null
  onSave: (data: Partial<MinibarProduct>) => void
  onClose: () => void
  saving: boolean
}

function ProductForm({ product, onSave, onClose, saving }: ProductFormProps) {
  const isEdit = !!product
  const [form, setForm] = useState<ProductFormData>({
    code:             product?.code ?? '',
    name:             product?.name ?? '',
    presentation:     product?.presentation ?? '',
    sale_price:       product?.sale_price != null ? String(product.sale_price) : '',
    cost_price:       product?.cost_price != null ? String(product.cost_price) : '',
    damage_price:     product?.damage_price != null ? String(product.damage_price) : '',
    stock_quantity:   product?.stock_quantity != null ? String(product.stock_quantity) : '0',
    expiration_date:  product?.expiration_date ?? '',
    has_expiration:   !!product?.expiration_date,
    description:      product?.description ?? '',
  })
  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Partial<MinibarProduct> = {
      code:            form.code.trim() || null,
      name:            form.name.trim(),
      presentation:    form.presentation.trim() || null,
      sale_price:      form.sale_price,
      cost_price:      form.cost_price || '0',
      damage_price:    form.damage_price || null,
      stock_quantity:  Number(form.stock_quantity) || 0,
      expiration_date: form.has_expiration && form.expiration_date ? form.expiration_date : null,
      description:     form.description.trim() || null,
    }
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Editar producto' : 'Nuevo producto de minibar'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Código</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                placeholder="Ej: COCA-330"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Presentación</label>
              <input
                type="text"
                value={form.presentation}
                onChange={(e) => set('presentation', e.target.value)}
                placeholder="Ej: Lata 330ml"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Precio compra</label>
              <input
                type="number" min="0" step="any"
                value={form.cost_price}
                onChange={(e) => set('cost_price', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Precio venta *</label>
              <input
                type="number" required min="0" step="any"
                value={form.sale_price}
                onChange={(e) => set('sale_price', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Precio daño</label>
              <input
                type="number" min="0" step="any"
                value={form.damage_price}
                onChange={(e) => set('damage_price', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Cantidad *</label>
              <input
                type="number" required min="0"
                value={form.stock_quantity}
                onChange={(e) => set('stock_quantity', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha de vencimiento</label>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={!form.has_expiration}
                  onChange={(e) => set('has_expiration', !e.target.checked)}
                />
                Sin vencimiento
              </label>
            </div>
            <input
              type="date"
              disabled={!form.has_expiration}
              required={form.has_expiration}
              value={form.expiration_date}
              onChange={(e) => set('expiration_date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Restock room modal ────────────────────────────────────────────────────────
interface RestockRoomModalProps {
  roomId: string
  roomNumber: string
  products: MinibarProduct[]
  onSave: (data: { room_id: string; minibar_product_id: string; quantity: number }) => void
  onClose: () => void
  saving: boolean
}

function RestockRoomModal({ roomId, roomNumber, products, onSave, onClose, saving }: RestockRoomModalProps) {
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('1')

  const qtyNum = Number(qty)
  const valid = productId && qtyNum > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Reponer minibar — Hab. {roomNumber}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Producto *</label>
            <select
              required value={productId} onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Seleccionar…</option>
              {products.filter(p => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.sale_price)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Cantidad a agregar *</label>
            <input
              type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            La cantidad se suma al stock actual del minibar de esta habitación.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button
              disabled={saving || !valid}
              onClick={() => onSave({ room_id: roomId, minibar_product_id: productId, quantity: qtyNum })}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Reponiendo…' : 'Reponer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Catalogue section ─────────────────────────────────────────────────────────
function CatalogueSection() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [modalProduct, setModalProduct] = useState<MinibarProduct | null | undefined>(undefined)

  const { data: products = [], isLoading } = useMinibarProducts()
  const { createMutation, updateMutation, deleteMutation } = useMinibarProductMutations()

  const handleSave = (formData: Partial<MinibarProduct>) => {
    if (modalProduct?.id) {
      updateMutation.mutate({ id: modalProduct.id, data: formData }, { onSuccess: () => setModalProduct(undefined) })
    } else {
      createMutation.mutate(formData, { onSuccess: () => setModalProduct(undefined) })
    }
  }

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
          Productos de minibar
        </span>
        {canManage && (
          <button onClick={() => setModalProduct(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={14} />Nuevo
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-4"><SkeletonTable rows={5} cols={5} /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin productos de minibar.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {['Código', 'Nombre', 'Presentación', 'P. compra', 'P. venta', 'Cantidad', 'Vence', 'Estado', ''].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const expired = p.expiration_date && new Date(p.expiration_date) < new Date()
                return (
                <tr key={p.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {p.code ?? '—'}
                  </td>
                  <td className="px-3 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                    {p.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{p.presentation ?? '—'}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.cost_price)}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.sale_price)}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: p.stock_quantity > 0 ? '#F0FDF4' : '#FEF2F2', color: p.stock_quantity > 0 ? '#16A34A' : '#DC2626' }}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: expired ? '#DC2626' : 'var(--text-secondary)' }}>
                    {p.expiration_date
                      ? new Date(p.expiration_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                      : <span style={{ color: 'var(--text-muted)' }}>Sin vencimiento</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: p.active ? '#F0FDF4' : '#F9FAFB', color: p.active ? '#16A34A' : '#6B7280' }}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {canManage && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModalProduct(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Desactivar este producto?')) deleteMutation.mutate(p.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalProduct !== undefined && (
        <ProductForm
          product={modalProduct}
          onSave={handleSave}
          onClose={() => setModalProduct(undefined)}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

// ── New minibar modal ────────────────────────────────────────────────────────
interface NewMinibarModalProps {
  availableRooms: Room[]
  onSave: (data: { room_id: string; name: string | null; notes: string | null }) => void
  onClose: () => void
  saving: boolean
}

function NewMinibarModal({ availableRooms, onSave, onClose, saving }: NewMinibarModalProps) {
  const [roomId, setRoomId] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nuevo minibar</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ room_id: roomId, name: name.trim() || null, notes: notes.trim() || null })
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Habitación *</label>
            <select
              required value={roomId} onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Seleccionar habitación…</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>Hab. {r.number}</option>
              ))}
            </select>
            {availableRooms.length === 0 && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Todas las habitaciones ya tienen un minibar asignado.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre (opcional)</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Minibar suite 101"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notas (opcional)</label>
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || !roomId} className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Minibars section (1 por habitación) ───────────────────────────────────────
function MinibarsSection() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const { rooms } = useRooms()
  const { data: minibars = [], isLoading: loadingMinibars } = useMinibars()
  const { data: products = [] } = useMinibarProducts()
  const { restockRoomMutation } = useMinibarProductMutations()
  const { createMutation, deleteMutation } = useMinibarMutations()

  const [showNew, setShowNew] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [restocking, setRestocking] = useState(false)

  const { data: roomMinibars = [], isLoading: loadingItems } = useRoomMinibars(selectedRoomId)

  const sortedMinibars = [...minibars].sort((a, b) => {
    const an = a.room?.number ?? ''
    const bn = b.room?.number ?? ''
    return an.localeCompare(bn, undefined, { numeric: true })
  })

  const usedRoomIds = new Set(minibars.map((m) => m.room_id))
  const availableRooms = rooms
    .filter((r) => !usedRoomIds.has(r.id))
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))

  const selectedMinibar = minibars.find((m) => m.room_id === selectedRoomId) ?? null
  const selectedRoomNumber = selectedMinibar?.room?.number
    ?? rooms.find((r) => r.id === selectedRoomId)?.number
    ?? ''

  const handleCreate = (data: { room_id: string; name: string | null; notes: string | null }) => {
    createMutation.mutate(data, { onSuccess: () => setShowNew(false) })
  }

  const handleDelete = (m: Minibar) => {
    const label = m.name ?? `Hab. ${m.room?.number ?? ''}`
    if (!confirm(`¿Eliminar minibar "${label}"? Sus productos asignados se desvinculan.`)) return
    deleteMutation.mutate(m.id, {
      onSuccess: () => {
        if (selectedRoomId === m.room_id) setSelectedRoomId(null)
      },
    })
  }

  const handleRestock = (data: { room_id: string; minibar_product_id: string; quantity: number }) => {
    restockRoomMutation.mutate(data, { onSuccess: () => setRestocking(false) })
  }

  return (
    <div className="space-y-4">
      {/* Listado de minibars */}
      <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            Minibars ({minibars.length})
          </span>
          {canManage && (
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              <Plus size={14} />Nuevo minibar
            </button>
          )}
        </div>

        {loadingMinibars ? (
          <div className="py-4"><SkeletonTable rows={3} cols={3} /></div>
        ) : minibars.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay minibars creados aún.
          </div>
        ) : (
          <ul>
            {sortedMinibars.map((m) => {
              const active = selectedRoomId === m.room_id
              return (
                <li key={m.id}
                  style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    style={active ? { background: 'var(--bg-input)' } : undefined}
                    onClick={() => setSelectedRoomId(active ? null : m.room_id)}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: 'var(--color-primary)' }}>
                      <BedDouble size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Hab. {m.room?.number ?? '—'} {m.name && <span className="font-normal" style={{ color: 'var(--text-muted)' }}>· {m.name}</span>}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {m.items?.length ?? 0} producto(s) asignado(s)
                        {m.notes && <> · {m.notes}</>}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(m) }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                        title="Eliminar minibar">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ChevronRight size={16}
                      style={{ color: 'var(--text-muted)', transform: active ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Detalle del minibar seleccionado */}
      {selectedMinibar && (
        <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              Productos del minibar — Hab. {selectedRoomNumber}
            </span>
            {canManage && (
              <button onClick={() => setRestocking(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium"
                style={{ background: 'var(--color-primary)' }}>
                <RefreshCw size={14} />Agregar / Reponer
              </button>
            )}
          </div>

          {loadingItems ? (
            <div className="py-4"><SkeletonTable rows={3} cols={4} /></div>
          ) : roomMinibars.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              Aún no se han agregado productos a este minibar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {['Producto', 'Cantidad', 'Precio venta', 'Última reposición', 'Por'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomMinibars.map((rm) => (
                    <tr key={rm.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {rm.product?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: rm.quantity > 0 ? '#F0FDF4' : '#FEF2F2', color: rm.quantity > 0 ? '#16A34A' : '#DC2626' }}>
                          {rm.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(rm.product?.sale_price ?? null)}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                          {formatDateTime(rm.last_restocked_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {rm.restocked_by_user?.name ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showNew && (
        <NewMinibarModal
          availableRooms={availableRooms}
          onSave={handleCreate}
          onClose={() => setShowNew(false)}
          saving={createMutation.isPending}
        />
      )}

      {restocking && selectedMinibar && (
        <RestockRoomModal
          roomId={selectedMinibar.room_id}
          roomNumber={selectedRoomNumber}
          products={products}
          onSave={handleRestock}
          onClose={() => setRestocking(false)}
          saving={restockRoomMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
const SUB_TABS = [
  { key: 'catalogue', label: 'Catálogo' },
  { key: 'room-stock', label: 'Minibar por habitación' },
] as const

type SubTab = (typeof SUB_TABS)[number]['key']

export default function MinibarTab() {
  const [sub, setSub] = useState<SubTab>('catalogue')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-input)' }}>
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={
              sub === key
                ? { background: 'var(--bg-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'catalogue'  && <CatalogueSection />}
      {sub === 'room-stock' && <MinibarsSection />}
    </div>
  )
}
