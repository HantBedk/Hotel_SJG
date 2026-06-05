import { useState } from 'react'
import { Plus, Pencil, Trash2, X, RefreshCw, Clock, BedDouble, ChevronRight, Undo2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  useMinibarProducts,
  useMinibarProductMutations,
  useRoomMinibars,
  useMinibars,
  useMinibarMutations,
  useInventoryItems,
} from '@/hooks/useInventory'
import { restockRoomMinibarApi, returnFromRoomMinibarApi } from '@/services/inventory.service'
import { useRooms } from '@/hooks/useRooms'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { InventoryItem, Minibar, MinibarProduct, Room } from '@/types'

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
  inventory_item_id: string
  sale_price: string
  cost_price: string
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
  const { data: inventoryData } = useInventoryItems({ per_page: 200 })
  const inventoryItems: InventoryItem[] = (inventoryData?.data ?? []) as InventoryItem[]

  const [form, setForm] = useState<ProductFormData>({
    code:              product?.code ?? '',
    name:              product?.name ?? '',
    presentation:      product?.presentation ?? '',
    inventory_item_id: product?.inventory_item_id ?? '',
    sale_price:        product?.sale_price != null ? String(product.sale_price) : '',
    cost_price:        product?.cost_price != null ? String(product.cost_price) : '',
    stock_quantity:    product?.stock_quantity != null ? String(product.stock_quantity) : '0',
    expiration_date:   product?.expiration_date ?? '',
    has_expiration:    !!product?.expiration_date,
    description:       product?.description ?? '',
  })
  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const costNum = parseFloat(form.cost_price) || 0
  const saleNum = parseFloat(form.sale_price) || 0
  const priceInvalid = form.sale_price !== '' && saleNum <= costNum
  const linkMissing  = !form.inventory_item_id

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (priceInvalid) return
    const payload: Partial<MinibarProduct> = {
      code:              form.code.trim() || null,
      name:              form.name.trim(),
      presentation:      form.presentation.trim() || null,
      inventory_item_id: form.inventory_item_id || null,
      sale_price:        form.sale_price,
      cost_price:        form.cost_price || '0',
      stock_quantity:    Number(form.stock_quantity) || 0,
      expiration_date:   form.has_expiration && form.expiration_date ? form.expiration_date : null,
      description:       form.description.trim() || null,
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
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Producto del catálogo (inventario) *
            </label>
            <select
              value={form.inventory_item_id}
              onChange={(e) => set('inventory_item_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                background: 'var(--bg-input)',
                borderColor: linkMissing ? '#F59E0B' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">— Selecciona un ítem del catálogo —</option>
              {inventoryItems.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} {it.presentation ? `(${it.presentation})` : ''} · Stock: {it.current_stock}
                </option>
              ))}
            </select>
            {linkMissing ? (
              <p className="text-[11px] mt-1" style={{ color: '#B45309' }}>
                Sin vínculo no se podrá reponer este producto en los minibares (no se podría descontar del catálogo).
              </p>
            ) : (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Al reponer se descontará del stock de este ítem del catálogo.
              </p>
            )}
            {inventoryItems.length === 0 && (
              <p className="text-[11px] mt-1" style={{ color: '#B45309' }}>
                Aún no hay ítems en el catálogo de inventario. Créalos desde la pestaña "Consumibles" antes de vincular.
              </p>
            )}
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
                style={{
                  background: 'var(--bg-input)',
                  borderColor: priceInvalid ? '#EF4444' : 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
          {priceInvalid && (
            <p className="text-[11px] -mt-2" style={{ color: '#EF4444' }}>
              El precio de venta debe ser mayor al precio de compra (${costNum.toLocaleString('es-CO')}).
            </p>
          )}

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
            <button type="submit" disabled={saving || priceInvalid} className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Restock room modal (multi-producto) ──────────────────────────────────────
interface RestockItem {
  id: string                // identificador local de la fila
  productId: string
  qty: string
}

interface RestockRoomModalProps {
  roomId: string
  roomNumber: string
  products: MinibarProduct[]
  onSave: (items: { minibar_product_id: string; quantity: number }[]) => void
  onClose: () => void
  saving: boolean
}

function RestockRoomModal({ roomNumber, products, onSave, onClose, saving }: RestockRoomModalProps) {
  const newRow = (): RestockItem => ({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    productId: '',
    qty: '1',
  })
  const [items, setItems] = useState<RestockItem[]>([newRow()])

  const updateItem = (id: string, patch: Partial<RestockItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const removeItem = (id: string) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)))
  const addRow = () => setItems((prev) => [...prev, newRow()])

  const activeProducts = products.filter((p) => p.active)

  const validItems = items
    .map((it) => ({ ...it, qtyNum: Number(it.qty) }))
    .filter((it) => it.productId && it.qtyNum > 0)

  // Productos ya seleccionados en otras filas — se ocultan del select.
  const selectedProductIds = (currentId: string) =>
    new Set(items.filter((it) => it.id !== currentId && it.productId).map((it) => it.productId))

  const handleSubmit = () => {
    // Consolidar duplicados (por si el usuario eligió el mismo producto dos veces).
    const map = new Map<string, number>()
    for (const it of validItems) {
      map.set(it.productId, (map.get(it.productId) ?? 0) + it.qtyNum)
    }
    const payload = Array.from(map.entries()).map(([minibar_product_id, quantity]) => ({
      minibar_product_id,
      quantity,
    }))
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Reponer minibar — Hab. {roomNumber}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto">
          {items.map((it, idx) => {
            const usedIds = selectedProductIds(it.id)
            return (
              <div key={it.id} className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  {idx === 0 && (
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Producto
                    </label>
                  )}
                  <select
                    value={it.productId}
                    onChange={(e) => updateItem(it.id, { productId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Seleccionar…</option>
                    {activeProducts
                      .filter((p) => !usedIds.has(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name}
                          {p.presentation ? ` · ${p.presentation}` : ''} — {formatCurrency(p.sale_price)}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-24">
                  {idx === 0 && (
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Cantidad
                    </label>
                  )}
                  <input
                    type="number" min="1"
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  disabled={items.length === 1}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: '#EF4444' }}
                  title="Quitar fila"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={13} /> Agregar otro producto
          </button>

          <p className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
            Las cantidades se suman al stock actual del minibar de esta habitación.
            {validItems.length > 0 && (
              <> Total: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{validItems.length} producto(s)</span>.</>
            )}
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button
            disabled={saving || validItems.length === 0}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}>
            {saving ? 'Reponiendo…' : 'Reponer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Return-to-catalog modal (multi-producto) ─────────────────────────────────
interface ReturnItem {
  id: string
  roomMinibarId: string
  productId: string
  productName: string
  available: number
  qty: string
}

interface ReturnToCatalogModalProps {
  roomNumber: string
  roomMinibars: RoomMinibar[]
  onSave: (items: { minibar_product_id: string; quantity: number }[]) => void
  onClose: () => void
  saving: boolean
}

function ReturnToCatalogModal({ roomNumber, roomMinibars, onSave, onClose, saving }: ReturnToCatalogModalProps) {
  const newRow = (): ReturnItem => ({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    roomMinibarId: '',
    productId: '',
    productName: '',
    available: 0,
    qty: '1',
  })
  const [items, setItems] = useState<ReturnItem[]>([newRow()])

  const inMinibar = roomMinibars.filter((rm) => rm.quantity > 0)

  const updateItem = (id: string, patch: Partial<ReturnItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const removeItem = (id: string) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)))
  const addRow = () => setItems((prev) => [...prev, newRow()])

  const selectedIds = (currentId: string) =>
    new Set(items.filter((it) => it.id !== currentId && it.roomMinibarId).map((it) => it.roomMinibarId))

  const validItems = items
    .map((it) => ({ ...it, qtyNum: Number(it.qty) }))
    .filter((it) => it.productId && it.qtyNum > 0 && it.qtyNum <= it.available)

  const overflow = items.some((it) => it.productId && Number(it.qty) > it.available)

  const handleSubmit = () => {
    // Consolidar duplicados (por si el usuario eligió el mismo producto dos veces).
    const map = new Map<string, number>()
    for (const it of validItems) {
      map.set(it.productId, (map.get(it.productId) ?? 0) + it.qtyNum)
    }
    onSave(
      Array.from(map.entries()).map(([minibar_product_id, quantity]) => ({
        minibar_product_id,
        quantity,
      })),
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Devolver al catálogo — Hab. {roomNumber}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto">
          {inMinibar.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No hay productos con stock en este minibar para devolver.
            </p>
          ) : items.map((it, idx) => {
            const used = selectedIds(it.id)
            return (
              <div key={it.id} className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  {idx === 0 && (
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Producto en el minibar
                    </label>
                  )}
                  <select
                    value={it.roomMinibarId}
                    onChange={(e) => {
                      const rm = inMinibar.find((r) => r.id === e.target.value)
                      updateItem(it.id, {
                        roomMinibarId: e.target.value,
                        productId: rm?.minibar_product_id ?? '',
                        productName: rm?.product?.name ?? '',
                        available: rm?.quantity ?? 0,
                        qty: rm ? String(Math.min(1, rm.quantity)) : '1',
                      })
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Seleccionar…</option>
                    {inMinibar
                      .filter((rm) => !used.has(rm.id))
                      .map((rm) => (
                        <option key={rm.id} value={rm.id}>
                          {rm.product?.code ? `[${rm.product.code}] ` : ''}{rm.product?.name ?? '—'} · disponibles: {rm.quantity}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-24">
                  {idx === 0 && (
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Cantidad
                    </label>
                  )}
                  <input
                    type="number" min="1" max={it.available || undefined}
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: it.productId && Number(it.qty) > it.available ? '#EF4444' : 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  disabled={items.length === 1}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: '#EF4444' }}
                  title="Quitar fila"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}

          {inMinibar.length > 0 && items.length < inMinibar.length && (
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              <Plus size={13} /> Agregar otro producto
            </button>
          )}

          {overflow && (
            <p className="text-[11px]" style={{ color: '#EF4444' }}>
              No puedes devolver más unidades de las disponibles en el minibar.
            </p>
          )}

          <p className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
            Las cantidades se restan del minibar y se suman al stock del catálogo (o del ítem de inventario vinculado).
            {validItems.length > 0 && (
              <> Total: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{validItems.length} producto(s)</span>.</>
            )}
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button
            disabled={saving || validItems.length === 0 || overflow}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
            style={{ background: '#F97316' }}>
            {saving ? 'Devolviendo…' : 'Devolver'}
          </button>
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
          <table className="w-full min-w-[820px] text-sm">
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

  const qc = useQueryClient()
  const { rooms } = useRooms()
  const { data: minibars = [], isLoading: loadingMinibars } = useMinibars()
  const { data: products = [] } = useMinibarProducts()
  const { createMutation, deleteMutation } = useMinibarMutations()

  const [showNew, setShowNew] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [restocking, setRestocking] = useState(false)
  const [savingRestock, setSavingRestock] = useState(false)
  const [returning, setReturning] = useState(false)
  const [savingReturn, setSavingReturn] = useState(false)

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

  const handleRestock = async (items: { minibar_product_id: string; quantity: number }[]) => {
    if (!selectedRoomId || items.length === 0) return
    setSavingRestock(true)
    try {
      await Promise.all(
        items.map((it) => restockRoomMinibarApi({ room_id: selectedRoomId, ...it })),
      )
      toast.success(
        items.length === 1
          ? 'Producto agregado al minibar.'
          : `${items.length} productos agregados al minibar.`,
      )
      qc.invalidateQueries({ queryKey: ['room-minibars', selectedRoomId] })
      qc.invalidateQueries({ queryKey: ['minibars'] })
      qc.invalidateQueries({ queryKey: ['minibar-products'] })
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-history'] })
      setRestocking(false)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'Error al reponer el minibar.')
    } finally {
      setSavingRestock(false)
    }
  }

  const handleReturn = async (items: { minibar_product_id: string; quantity: number }[]) => {
    if (!selectedRoomId || items.length === 0) return
    setSavingReturn(true)
    try {
      await Promise.all(
        items.map((it) => returnFromRoomMinibarApi({ room_id: selectedRoomId, ...it })),
      )
      toast.success(
        items.length === 1
          ? 'Producto devuelto al catálogo.'
          : `${items.length} productos devueltos al catálogo.`,
      )
      qc.invalidateQueries({ queryKey: ['room-minibars', selectedRoomId] })
      qc.invalidateQueries({ queryKey: ['minibars'] })
      qc.invalidateQueries({ queryKey: ['minibar-products'] })
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-history'] })
      setReturning(false)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'Error al devolver al catálogo.')
    } finally {
      setSavingReturn(false)
    }
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
              <div className="flex gap-2">
                <button
                  onClick={() => setReturning(true)}
                  disabled={roomMinibars.length === 0}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: '#F97316', color: '#F97316' }}>
                  <Undo2 size={14} />Devolver al catálogo
                </button>
                <button onClick={() => setRestocking(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium"
                  style={{ background: 'var(--color-primary)' }}>
                  <RefreshCw size={14} />Agregar / Reponer
                </button>
              </div>
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
          saving={savingRestock}
        />
      )}

      {returning && selectedMinibar && (
        <ReturnToCatalogModal
          roomNumber={selectedRoomNumber}
          roomMinibars={roomMinibars}
          onSave={handleReturn}
          onClose={() => setReturning(false)}
          saving={savingReturn}
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
