import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import { useInventoryItems, useInventoryCategories, useInventoryMutations } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import type { InventoryItem, InventoryCategory } from '@/types'

function formatCurrency(v: string | number | null) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

function StockBadge({ item }: { item: InventoryItem }) {
  const low = item.current_stock <= item.min_stock_threshold
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: low ? '#FEF2F2' : '#F0FDF4',
        color: low ? '#DC2626' : '#16A34A',
      }}
    >
      {item.current_stock} {item.unit}
    </span>
  )
}

// ── Item form modal ───────────────────────────────────────────────────────────
interface ItemFormProps {
  item?: InventoryItem | null
  categories: InventoryCategory[]
  onSave: (data: Partial<InventoryItem>) => void
  onClose: () => void
  saving: boolean
}

function ItemForm({ item, categories, onSave, onClose, saving }: ItemFormProps) {
  const [form, setForm] = useState({
    category_id:         item?.category_id ?? '',
    name:                item?.name ?? '',
    brand:               item?.brand ?? '',
    presentation:        item?.presentation ?? '',
    unit:                item?.unit ?? 'unidad',
    cost_price:          item?.cost_price ?? '',
    sale_price:          item?.sale_price ?? '',
    current_stock:       item ? String(item.current_stock) : '0',
    min_stock_threshold: item ? String(item.min_stock_threshold) : '5',
    expiry_date:         item?.expiry_date ?? '',
    supplier:            item?.supplier ?? '',
    location:            item?.location ?? '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...form,
      current_stock: Number(form.current_stock),
      min_stock_threshold: Number(form.min_stock_threshold),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-2xl rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {item ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Categoría *</label>
            <select
              required
              value={form.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Seleccionar…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {[
            { key: 'name',         label: 'Nombre *',       required: true },
            { key: 'brand',        label: 'Marca',          required: false },
            { key: 'presentation', label: 'Presentación',   required: false },
            { key: 'unit',         label: 'Unidad',         required: false },
            { key: 'cost_price',   label: 'Precio costo *', required: true, type: 'number' },
            { key: 'sale_price',   label: 'Precio venta',   required: false, type: 'number' },
            { key: 'current_stock',label: 'Stock inicial',  required: false, type: 'number' },
            { key: 'min_stock_threshold', label: 'Stock mínimo', required: false, type: 'number' },
            { key: 'expiry_date',  label: 'Vencimiento',    required: false, type: 'date' },
            { key: 'supplier',     label: 'Proveedor',      required: false },
            { key: 'location',     label: 'Ubicación',      required: false },
          ].map(({ key, label, required, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input
                type={type}
                required={required}
                step={type === 'number' ? 'any' : undefined}
                min={type === 'number' ? '0' : undefined}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                disabled={!!item && (key === 'current_stock')}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Restock modal ─────────────────────────────────────────────────────────────
interface RestockModalProps {
  item: InventoryItem
  onSave: (data: { quantity: number; unit_price?: number; notes?: string }) => void
  onClose: () => void
  saving: boolean
}

function RestockModal({ item, onSave, onClose, saving }: RestockModalProps) {
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState(item.cost_price)
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recargar stock — {item.name}</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Cantidad *</label>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Precio unitario</label>
            <input type="number" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notas</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button
              disabled={saving || !qty}
              onClick={() => onSave({ quantity: Number(qty), unit_price: price ? Number(price) : undefined, notes: notes || undefined })}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Recargar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function ConsumiblesTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [modalItem, setModalItem] = useState<InventoryItem | null | undefined>(undefined)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)

  const { data: categoriesData } = useInventoryCategories()
  const categories = categoriesData ?? []

  const filters = {
    search: search || undefined,
    category_id: categoryId || undefined,
    low_stock: lowStock || undefined,
  }

  const { data, isLoading } = useInventoryItems(filters)
  const items = data?.data ?? []

  const { createMutation, updateMutation, deleteMutation, restockMutation } = useInventoryMutations()

  const handleSave = (formData: Partial<InventoryItem>) => {
    if (modalItem?.id) {
      updateMutation.mutate({ id: modalItem.id, data: formData }, { onSuccess: () => setModalItem(undefined) })
    } else {
      createMutation.mutate(formData, { onSuccess: () => setModalItem(undefined) })
    }
  }

  const handleRestock = (data: { quantity: number; unit_price?: number; notes?: string }) => {
    if (!restockItem) return
    restockMutation.mutate({ id: restockItem.id, data }, { onSuccess: () => setRestockItem(null) })
  }

  return (
    <div
      className="rounded-xl border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Buscar por nombre, código, marca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => setLowStock((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
          style={{
            background: lowStock ? '#FEF2F2' : 'var(--bg-input)',
            borderColor: lowStock ? '#DC2626' : 'var(--border-default)',
            color: lowStock ? '#DC2626' : 'var(--text-secondary)',
          }}
        >
          <SlidersHorizontal size={14} />
          Stock bajo
        </button>
        {canManage && (
          <button
            onClick={() => setModalItem(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={14} />
            Nuevo
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin productos.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {['Código', 'Nombre', 'Categoría', 'Stock', 'Costo', 'Vencimiento', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{item.code}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                    {item.brand && <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>{item.brand}</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{item.category?.name ?? '—'}</td>
                  <td className="px-4 py-3"><StockBadge item={item} /></td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.cost_price)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {item.expiry_date
                      ? new Date(item.expiry_date).toLocaleDateString('es-CO')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {canManage && (
                        <>
                          <button
                            onClick={() => setRestockItem(item)}
                            title="Recargar stock"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => setModalItem(item)}
                            title="Editar"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este producto?')) deleteMutation.mutate(item.id)
                            }}
                            title="Eliminar"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalItem !== undefined && (
        <ItemForm
          item={modalItem}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {restockItem && (
        <RestockModal
          item={restockItem}
          onSave={handleRestock}
          onClose={() => setRestockItem(null)}
          saving={restockMutation.isPending}
        />
      )}
    </div>
  )
}
