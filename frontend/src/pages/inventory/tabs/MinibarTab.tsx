import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useMinibarProducts, useMinibarProductMutations } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import type { MinibarProduct } from '@/types'

function formatCurrency(v: string | number | null) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

// ── Product form ──────────────────────────────────────────────────────────────
interface ProductFormProps {
  product?: MinibarProduct | null
  onSave: (data: Partial<MinibarProduct>) => void
  onClose: () => void
  saving: boolean
}

function ProductForm({ product, onSave, onClose, saving }: ProductFormProps) {
  const [form, setForm] = useState({
    name:         product?.name ?? '',
    sale_price:   product?.sale_price ?? '',
    cost_price:   product?.cost_price ?? '',
    damage_price: product?.damage_price ?? '',
    description:  product?.description ?? '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {product ? 'Editar producto' : 'Nuevo producto de minibar'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form) }}
          className="p-6 space-y-4"
        >
          {[
            { key: 'name',         label: 'Nombre *',        required: true, type: 'text' },
            { key: 'sale_price',   label: 'Precio venta *',  required: true, type: 'number' },
            { key: 'cost_price',   label: 'Precio costo',    required: false, type: 'number' },
            { key: 'damage_price', label: 'Precio daño',     required: false, type: 'number' },
            { key: 'description',  label: 'Descripción',     required: false, type: 'text' },
          ].map(({ key, label, required, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input
                type={type}
                required={required}
                step={type === 'number' ? 'any' : undefined}
                min={type === 'number' ? '0' : undefined}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
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

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function MinibarTab() {
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
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin productos de minibar.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {['Nombre', 'Precio venta', 'Precio costo', 'Precio daño', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                    {p.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.sale_price)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.cost_price)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.damage_price)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: p.active ? '#F0FDF4' : '#F9FAFB', color: p.active ? '#16A34A' : '#6B7280' }}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
              ))}
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
