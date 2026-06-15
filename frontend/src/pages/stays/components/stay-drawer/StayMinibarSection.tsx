import { useState } from 'react'
import { ShoppingCart, Plus, Trash2 } from 'lucide-react'
import type { MinibarConsumption, MinibarConsumptionType, MinibarItem, Stay, StayRoom } from '@/types'
import { useMinibarProducts } from '@/hooks/useInventory'
import { MinibarProductPicker } from '@/components/minibar/MinibarProductPicker'
import type { MinibarRow } from './types'
import { formatCurrency, isValidMinibarRow, minibarConfirmLabel, minibarTypeBadge } from './utils'

interface StayMinibarSectionProps {
  readonly stayId: string
  readonly stay: Stay
  readonly activeRooms: readonly StayRoom[]
  readonly canCancelMinibar: boolean
  readonly onAddMinibar: (payload: { stayId: string; items: MinibarItem[] }) => Promise<unknown>
  readonly onRequestCancel: (consumption: MinibarConsumption) => void
}

function createBlankRow(defaultRoomId: string): MinibarRow {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    minibar_product_id: '',
    query: '',
    showList: false,
    room_id: defaultRoomId,
    type: 'consumed',
    quantity: '1',
    unit_price: '',
  }
}

export function StayMinibarSection({
  stayId, stay, activeRooms, canCancelMinibar, onAddMinibar, onRequestCancel,
}: StayMinibarSectionProps) {
  const { data: minibarProducts = [] } = useMinibarProducts()
  const defaultRoomId = activeRooms[0]?.room_id ?? ''

  const [showForm, setShowForm] = useState(false)
  const [rows, setRows] = useState<MinibarRow[]>(() => [createBlankRow(defaultRoomId)])
  const [isSaving, setIsSaving] = useState(false)

  const updateRow = (id: string, patch: Partial<MinibarRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)))

  const addRow = () => setRows((prev) => [...prev, createBlankRow(defaultRoomId)])

  const resetRows = () => setRows([createBlankRow(defaultRoomId)])

  const priceForProductType = (productId: string, type: MinibarConsumptionType): string => {
    const product = minibarProducts.find((p) => p.id === productId)
    if (!product) return ''
    const v = type === 'damaged' ? (product.damage_price ?? product.sale_price) : product.sale_price
    return String(v ?? '')
  }

  const buildItems = (): MinibarItem[] => {
    const items: MinibarItem[] = []
    for (const row of rows) {
      const product = minibarProducts.find((p) => p.id === row.minibar_product_id)
      const qty = Number.parseInt(row.quantity, 10)
      const unit = Number.parseFloat(row.unit_price)
      if (isValidMinibarRow(product, row.room_id, qty, unit)) {
        items.push({
          product_name: product.name,
          room_id: row.room_id,
          type: row.type,
          quantity: qty,
          unit_price: unit,
        })
      }
    }
    return items
  }

  const validItems = buildItems()

  const handleAdd = async () => {
    if (validItems.length === 0) return
    setIsSaving(true)
    try {
      await onAddMinibar({ stayId, items: validItems })
      setShowForm(false)
      resetRows()
    } finally {
      setIsSaving(false)
    }
  }

  if (stay.status !== 'active') return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Minibar</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={12} /> Registrar
          </button>
        )}
      </div>

      {stay.minibar_consumptions && stay.minibar_consumptions.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {stay.minibar_consumptions.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm gap-2">
              <span className="flex-1 min-w-0" style={{ color: 'var(--text-secondary)' }}>
                {m.product_name} × {m.quantity}
                {minibarTypeBadge(m.type)}
              </span>
              <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(m.total)}
              </span>
              {canCancelMinibar && (
                <button
                  type="button"
                  onClick={() => onRequestCancel(m)}
                  title="Anular consumo"
                  aria-label="Anular consumo"
                  className="p-1 rounded-md hover:opacity-70"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
        >
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="space-y-2 pb-3"
              style={idx < rows.length - 1 ? { borderBottom: '1px dashed var(--border-default)' } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Producto {idx + 1}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                    style={{ color: '#EF4444' }}
                    title="Quitar producto"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <MinibarProductPicker
                roomId={row.room_id}
                query={row.query}
                show={row.showList}
                selectedId={row.minibar_product_id}
                products={minibarProducts}
                onQueryChange={(q) => updateRow(row.id, {
                  query: q,
                  showList: true,
                  ...(row.minibar_product_id ? { minibar_product_id: '', unit_price: '' } : {}),
                })}
                onFocus={() => updateRow(row.id, { showList: true })}
                onBlur={() => setTimeout(() => updateRow(row.id, { showList: false }), 150)}
                onSelect={(p) => updateRow(row.id, {
                  minibar_product_id: p.id,
                  query: p.code ? `${p.code} · ${p.name}` : p.name,
                  showList: false,
                  unit_price: priceForProductType(p.id, row.type),
                })}
              />

              {activeRooms.length > 1 && (
                <select
                  value={row.room_id}
                  onChange={(e) => updateRow(row.id, { room_id: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  {activeRooms.map((sr) => (
                    <option key={sr.room_id} value={sr.room_id}>Hab. {sr.room?.number}</option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={row.type}
                  onChange={(e) => {
                    const type = e.target.value as MinibarConsumptionType
                    updateRow(row.id, {
                      type,
                      unit_price: row.minibar_product_id
                        ? priceForProductType(row.minibar_product_id, type)
                        : row.unit_price,
                    })
                  }}
                  className="min-w-0 px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <option value="consumed">Consumido</option>
                  <option value="damaged">Dañado</option>
                  <option value="missing">Faltante</option>
                </select>
                <input
                  type="number"
                  min={1}
                  placeholder="Cant."
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                  className="min-w-0 px-2 py-2 rounded-lg text-xs border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  placeholder="Precio unit."
                  value={row.unit_price}
                  readOnly
                  tabIndex={-1}
                  title="El precio se toma del producto del catálogo y no puede modificarse aquí."
                  className="min-w-0 px-2 py-2 rounded-lg text-xs border outline-none cursor-not-allowed"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={12} /> Agregar otro producto
          </button>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={validItems.length === 0 || isSaving}
              className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {minibarConfirmLabel(isSaving, validItems.length)}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetRows() }}
              className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
