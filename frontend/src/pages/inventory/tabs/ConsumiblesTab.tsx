import { useState, useRef, useEffect, useMemo, type SubmitEvent, type ElementType } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw, SlidersHorizontal, X, Truck, FolderPlus, Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useInventoryItems, useInventoryCategories, useInventoryMutations, useCreateCategory, useLowStockThreshold, useSetLowStockThreshold } from '@/hooks/useInventory'
import { useAdminUsers } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { cn } from '@/lib/cn'
import type { InventoryItem, InventoryCategory, AdminUser } from '@/types'

function formatCurrency(v: string | number | null) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

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

function thresholdButtonStyle(threshold: number | null) {
  if (threshold === null) {
    return {
      background: 'var(--bg-input)',
      borderColor: 'var(--border-default)',
      color: 'var(--text-secondary)',
    }
  }
  return {
    background: '#FEF2F2',
    borderColor: '#DC2626',
    color: '#DC2626',
  }
}

interface StockBadgeProps {
  readonly item: InventoryItem
}

function StockBadge({ item }: StockBadgeProps) {
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

// ── Category quick-create ─────────────────────────────────────────────────────
const CATEGORY_TYPES = [
  { value: 'consumable', label: 'Consumible' },
  { value: 'asset',      label: 'Activo' },
  { value: 'cleaning',   label: 'Limpieza' },
]

interface CategoryQuickFormProps {
  readonly onCreated: (id: string) => void
}

function CategoryQuickForm({ onCreated }: CategoryQuickFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('consumable')
  const { mutate, isPending } = useCreateCategory()

  const submit = () => {
    if (!name.trim()) return
    mutate({ name: name.trim(), type }, {
      onSuccess: (cat) => { onCreated(cat.id); setOpen(false); setName('') },
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs mt-1"
        style={{ color: 'var(--color-primary)' }}
      >
        <FolderPlus size={12} /> Nueva categoría
      </button>
    )
  }

  return (
    <div className="mt-2 p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
      <input
        autoFocus
        type="text"
        placeholder="Nombre de la categoría"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
        className="w-full px-3 py-1.5 rounded-lg border text-sm"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg border text-sm"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
      >
        {CATEGORY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !name.trim()}
          className="px-3 py-1 rounded-lg text-xs text-white font-medium disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setName('') }}
          className="px-3 py-1 rounded-lg text-xs border"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Item form modal ───────────────────────────────────────────────────────────
interface ItemFormProps {
  readonly item?: InventoryItem | null
  readonly categories: InventoryCategory[]
  readonly existingItems: InventoryItem[]
  readonly onSave: (data: Partial<InventoryItem>) => void
  readonly onClose: () => void
  readonly onRestockExisting?: (item: InventoryItem) => void
  readonly saving: boolean
}

type ItemFormFieldKey =
  | 'name'
  | 'brand'
  | 'presentation'
  | 'cost_price'
  | 'sale_price'
  | 'current_stock'
  | 'expiry_date'
  | 'supplier'
  | 'location'

const ITEM_FORM_FIELDS: {
  key: ItemFormFieldKey
  label: string
  required: boolean
  type?: string
}[] = [
  { key: 'name', label: 'Nombre *', required: true },
  { key: 'brand', label: 'Marca', required: false },
  { key: 'presentation', label: 'Presentación', required: false },
  { key: 'cost_price', label: 'Precio costo *', required: true, type: 'number' },
  { key: 'sale_price', label: 'Precio venta', required: false, type: 'number' },
  { key: 'current_stock', label: 'Stock inicial', required: false, type: 'number' },
  { key: 'expiry_date', label: 'Vencimiento', required: false, type: 'date' },
  { key: 'supplier', label: 'Proveedor', required: false },
  { key: 'location', label: 'Ubicación', required: false },
]

interface ItemFormState {
  category_id: string
  name: string
  brand: string
  presentation: string
  unit: string
  cost_price: string
  sale_price: string
  current_stock: string
  min_stock_threshold: string
  expiry_date: string
  supplier: string
  location: string
}

function ItemForm({ item, categories, existingItems, onSave, onClose, onRestockExisting, saving }: ItemFormProps) {
  const [form, setForm] = useState<ItemFormState>({
    category_id: item?.category_id ?? '',
    name: item?.name ?? '',
    brand: item?.brand ?? '',
    presentation: item?.presentation ?? '',
    unit: item?.unit ?? 'unidad',
    cost_price: item?.cost_price ?? '',
    sale_price: item?.sale_price ?? '',
    current_stock: item ? String(item.current_stock) : '0',
    min_stock_threshold: item ? String(item.min_stock_threshold) : '5',
    expiry_date: item?.expiry_date ?? '',
    supplier: item?.supplier ?? '',
    location: item?.location ?? '',
  })

  const setField = <K extends keyof ItemFormState>(key: K, value: ItemFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)
  const dialogLabel = item ? 'Editar producto' : 'Nuevo producto'

  // Sugerencia de duplicado solo en modo creación
  const duplicateMatch = !item && form.brand.trim() && form.presentation.trim()
    ? existingItems.find((it) =>
        it.brand?.trim().toLowerCase() === form.brand.trim().toLowerCase() &&
        it.presentation?.trim().toLowerCase() === form.presentation.trim().toLowerCase()
      )
    : undefined

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({
      ...form,
      current_stock: Number(form.current_stock),
      min_stock_threshold: Number(form.min_stock_threshold),
    })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={dialogLabel}
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
      <div
        className="relative z-10 pointer-events-auto w-full max-w-2xl rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {dialogLabel}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="item-category-id" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Categoría *
            </label>
            <select
              id="item-category-id"
              required
              value={form.category_id}
              onChange={(e) => setField('category_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Seleccionar…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <CategoryQuickForm onCreated={(id) => setField('category_id', id)} />
          </div>
          {ITEM_FORM_FIELDS.map(({ key, label, required, type = 'text' }) => {
            const inputId = `item-field-${key}`
            return (
              <div key={key}>
                <label htmlFor={inputId} className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </label>
                <input
                  id={inputId}
                  type={type}
                  required={required}
                  step={type === 'number' ? 'any' : undefined}
                  min={type === 'number' ? '0' : undefined}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  disabled={!!item && key === 'current_stock'}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
            )
          })}
          {duplicateMatch && (
            <div
              className="col-span-2 rounded-lg p-3 text-xs flex items-start gap-2"
              style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E' }}
            >
              <span className="font-semibold whitespace-nowrap">⚠ Posible duplicado:</span>
              <span className="flex-1">
                ya existe <strong>{duplicateMatch.name}</strong> ({duplicateMatch.code}) con la misma marca y presentación. Stock actual: {duplicateMatch.current_stock} {duplicateMatch.unit}.
              </span>
              {onRestockExisting && (
                <button
                  type="button"
                  onClick={() => onRestockExisting(duplicateMatch)}
                  className="ml-auto px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap"
                  style={{ background: '#D97706', color: '#fff' }}
                >
                  Recargar existente
                </button>
              )}
            </div>
          )}
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
    </dialog>
  )
}

// ── Restock modal ─────────────────────────────────────────────────────────────
interface RestockModalProps {
  readonly item: InventoryItem
  readonly onSave: (data: { quantity: number; unit_price?: number; notes?: string }) => void
  readonly onClose: () => void
  readonly saving: boolean
}

function RestockModal({ item, onSave, onClose, saving }: RestockModalProps) {
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState(item.cost_price)
  const [notes, setNotes] = useState('')
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Recargar stock — ${item.name}`}
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
      <div
        className="relative z-10 pointer-events-auto w-full max-w-sm rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recargar stock — {item.name}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="restock-qty" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Cantidad *
            </label>
            <input
              id="restock-qty"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label htmlFor="restock-price" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Precio unitario
            </label>
            <input
              id="restock-price"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label htmlFor="restock-notes" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Notas
            </label>
            <input
              id="restock-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || !qty}
              onClick={() => onSave({ quantity: Number(qty), unit_price: price ? Number(price) : undefined, notes: notes || undefined })}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              {saving ? 'Guardando…' : 'Recargar'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

// ── Deliver to housekeeping modal ────────────────────────────────────────────
interface DeliverModalProps {
  readonly item: InventoryItem
  readonly users: AdminUser[]
  readonly onSave: (data: { quantity: number; destination_user_id: string; notes?: string }) => void
  readonly onClose: () => void
  readonly saving: boolean
}

function DeliverModal({ item, users, onSave, onClose, saving }: DeliverModalProps) {
  const [qty, setQty] = useState('1')
  const [userId, setUserId] = useState('')
  const [notes, setNotes] = useState('')

  const eligibleUsers = users.filter(
    (u) => u.is_active && (u.role === 'housekeeping' || u.role === 'maintenance')
  )

  const qtyNum = Number(qty)
  const exceedsStock = qtyNum > item.current_stock
  const valid = qtyNum > 0 && userId && !exceedsStock
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Entregar — ${item.name}`}
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
      <div
        className="relative z-10 pointer-events-auto w-full max-w-sm rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Entregar — {item.name}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Stock actual: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.current_stock} {item.unit}</span>
          </p>
          <div>
            <label htmlFor="deliver-user" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Empleado destino *
            </label>
            <select
              id="deliver-user"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Seleccionar…</option>
              {eligibleUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
              ))}
            </select>
            {eligibleUsers.length === 0 && (
              <p className="text-xs mt-1" style={{ color: '#DC2626' }}>
                No hay usuarios activos con rol housekeeping/maintenance.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="deliver-qty" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Cantidad *
            </label>
            <input
              id="deliver-qty"
              type="number"
              min="1"
              max={item.current_stock}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
            {exceedsStock && (
              <p className="text-xs mt-1" style={{ color: '#DC2626' }}>Excede el stock disponible.</p>
            )}
          </div>
          <div>
            <label htmlFor="deliver-notes" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Notas
            </label>
            <input
              id="deliver-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo, sector, etc."
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || !valid}
              onClick={() => onSave({ quantity: qtyNum, destination_user_id: userId, notes: notes || undefined })}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}
            >
              {saving ? 'Entregando…' : 'Entregar'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
type SortKey = 'code' | 'name' | 'category' | 'current_stock' | 'cost_price' | 'expiry_date'
type SortDir = 'asc' | 'desc'

function sortHeaderIcon(active: boolean, dir: SortDir): ElementType {
  if (active && dir === 'asc') return ArrowUp
  if (active && dir === 'desc') return ArrowDown
  return ArrowUpDown
}

const COLUMNS: { key: SortKey | null; label: string; numeric?: boolean }[] = [
  { key: 'code',          label: 'Código' },
  { key: 'name',          label: 'Nombre' },
  { key: 'category',      label: 'Categoría' },
  { key: 'current_stock', label: 'Stock',       numeric: true },
  { key: 'cost_price',    label: 'Costo',       numeric: true },
  { key: 'expiry_date',   label: 'Vencimiento' },
  { key: null,            label: '' },
]

export default function ConsumiblesTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [thresholdOpen, setThresholdOpen] = useState(false)
  const [thresholdInput, setThresholdInput] = useState('')
  const thresholdRef = useRef<HTMLDivElement>(null)

  const { data: thresholdData } = useLowStockThreshold()
  const setThreshold = useSetLowStockThreshold()
  const currentThreshold = thresholdData?.threshold ?? null

  useEffect(() => {
    if (thresholdOpen) {
      setThresholdInput(currentThreshold === null ? '' : String(currentThreshold))
    }
  }, [thresholdOpen, currentThreshold])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (thresholdRef.current && !thresholdRef.current.contains(e.target as Node)) {
        setThresholdOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const [modalItem, setModalItem] = useState<InventoryItem | null | undefined>(undefined)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [deliverItem, setDeliverItem] = useState<InventoryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)

  const { data: categoriesData } = useInventoryCategories()
  const categories = categoriesData ?? []

  const { data: usersData } = useAdminUsers()
  const users = usersData ?? []

  const filters = {
    search: search || undefined,
    category_id: categoryId || undefined,
  }

  const { data, isLoading } = useInventoryItems(filters)
  const items = data?.data ?? []

  const sortedItems = useMemo(() => {
    const arr = [...items]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'code':
        case 'name': {
          const av = (a[sortKey] ?? '').toString()
          const bv = (b[sortKey] ?? '').toString()
          cmp = av.localeCompare(bv, 'es', { numeric: true, sensitivity: 'base' })
          break
        }
        case 'category': {
          const av = a.category?.name ?? ''
          const bv = b.category?.name ?? ''
          cmp = av.localeCompare(bv, 'es', { sensitivity: 'base' })
          break
        }
        case 'current_stock': {
          cmp = a.current_stock - b.current_stock
          break
        }
        case 'cost_price': {
          cmp = (Number(a.cost_price) || 0) - (Number(b.cost_price) || 0)
          break
        }
        case 'expiry_date': {
          const at = a.expiry_date ? new Date(a.expiry_date).getTime() : Number.POSITIVE_INFINITY
          const bt = b.expiry_date ? new Date(b.expiry_date).getTime() : Number.POSITIVE_INFINITY
          cmp = at - bt
          break
        }
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      return cmp * dir
    })
    return arr
  }, [items, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      const col = COLUMNS.find((c) => c.key === key)
      setSortDir(col?.numeric ? 'desc' : 'asc')
    }
  }

  const { createMutation, updateMutation, deleteMutation, restockMutation, deliverMutation } = useInventoryMutations()

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

  const handleDeliver = (data: { quantity: number; destination_user_id: string; notes?: string }) => {
    if (!deliverItem) return
    deliverMutation.mutate({ id: deliverItem.id, data }, { onSuccess: () => setDeliverItem(null) })
  }

  const thresholdStyles = thresholdButtonStyle(currentThreshold)

  let tableContent
  if (isLoading) {
    tableContent = (
      <div className="py-4"><SkeletonTable rows={6} cols={6} /></div>
    )
  } else if (items.length === 0) {
    tableContent = (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin productos.</div>
    )
  } else {
    tableContent = (
      <>
        <div className="md:hidden space-y-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{item.code}{item.brand ? ` · ${item.brand}` : ''}</p>
                </div>
                <StockBadge item={item} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Categoría:</span> {item.category?.name ?? '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Costo:</span> {formatCurrency(item.cost_price)}</div>
                <div className="col-span-2">
                  <span style={{ color: 'var(--text-muted)' }}>Vence:</span>{' '}
                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('es-CO') : '—'}
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockItem(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs border"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--color-primary)' }}
                  >
                    <RefreshCw size={13} /> Recargar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverItem(item)}
                    disabled={item.current_stock <= 0}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs border disabled:opacity-30"
                    style={{ borderColor: 'var(--border-default)', color: '#8B5CF6' }}
                  >
                    <Truck size={13} /> Entregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalItem(item)}
                    className="p-2 rounded-lg border"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-lg border text-red-500"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {COLUMNS.map((col) => {
                  const columnKey = col.key
                  if (!columnKey) {
                    return <th key="actions" className="px-4 py-3 text-left font-medium"></th>
                  }
                  const active = sortKey === columnKey
                  const Icon = sortHeaderIcon(active, sortDir)
                  return (
                    <th key={columnKey} className="px-4 py-3 text-left font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort(columnKey)}
                        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                        style={{ color: active ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                      >
                        {col.label}
                        <Icon size={12} style={{ opacity: active ? 1 : 0.5 }} />
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
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
                            type="button"
                            onClick={() => setRestockItem(item)}
                            title="Recargar stock"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliverItem(item)}
                            disabled={item.current_stock <= 0}
                            title={item.current_stock <= 0 ? 'Sin stock para entregar' : 'Entregar a housekeeping'}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                            style={{ color: '#8B5CF6' }}
                          >
                            <Truck size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalItem(item)}
                            title="Editar"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
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
      </>
    )
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
        <div className="relative" ref={thresholdRef}>
          <button
            type="button"
            onClick={() => setThresholdOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
            style={thresholdStyles}
          >
            <SlidersHorizontal size={14} />
            Stock bajo{currentThreshold === null ? '' : ` ≤ ${currentThreshold}`}
          </button>
          {thresholdOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-20 rounded-xl p-3 shadow-lg space-y-2 w-52"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Notificar cuando stock ≤
              </p>
              <input
                autoFocus
                type="number"
                min="1"
                placeholder="Ej: 5"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && thresholdInput) {
                    setThreshold.mutate(Number(thresholdInput), { onSuccess: () => setThresholdOpen(false) })
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (thresholdInput) setThreshold.mutate(Number(thresholdInput), { onSuccess: () => setThresholdOpen(false) })
                  }}
                  disabled={!thresholdInput || setThreshold.isPending}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-white font-medium disabled:opacity-40"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <Check size={11} />
                  {setThreshold.isPending ? 'Guardando…' : 'Guardar'}
                </button>
                {currentThreshold !== null && (
                  <button
                    onClick={() => { setThresholdInput(''); setThresholdOpen(false) }}
                    className="px-2 py-1.5 rounded-lg text-xs border"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              {currentThreshold !== null && (
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Umbral actual: {currentThreshold} unidades
                </p>
              )}
            </div>
          )}
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalItem(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={14} />
            Nuevo
          </button>
        )}
      </div>

      {tableContent}

      {modalItem !== undefined && (
        <ItemForm
          item={modalItem}
          categories={categories}
          existingItems={items}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
          onRestockExisting={(existing) => { setModalItem(undefined); setRestockItem(existing) }}
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

      {deliverItem && (
        <DeliverModal
          item={deliverItem}
          users={users}
          onSave={handleDeliver}
          onClose={() => setDeliverItem(null)}
          saving={deliverMutation.isPending}
        />
      )}

      <DeleteConfirmDialog
        target={deleteTarget}
        title="Eliminar producto"
        message={
          deleteTarget
            ? `¿Estás seguro de eliminar ${deleteTarget.name}?`
            : ''
        }
        loading={deleteMutation.isPending}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: () => setDeleteTarget(null) })}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
