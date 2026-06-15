import { useMemo } from 'react'
import { useRoomMinibars } from '@/hooks/useInventory'
import type { MinibarProduct } from '@/types'

interface Props {
  readonly roomId: string
  readonly query: string
  readonly show: boolean
  readonly selectedId: string
  readonly onQueryChange: (q: string) => void
  readonly onFocus: () => void
  readonly onBlur: () => void
  readonly onSelect: (product: MinibarProduct, stock: number) => void
  readonly products: MinibarProduct[]
}

/**
 * Selector de producto de minibar con verificación de stock por habitación.
 *
 * Carga el inventario real de la habitación (RoomMinibar) y muestra cada producto
 * con su stock disponible. Los que tienen stock 0 (o no están en el minibar de
 * esa habitación) se renderizan deshabilitados con badge "AGOTADO" para evitar
 * cargar consumos imposibles.
 */
export function MinibarProductPicker({
  roomId,
  query,
  show,
  selectedId,
  onQueryChange,
  onFocus,
  onBlur,
  onSelect,
  products,
}: Props) {
  const { data: roomMinibars = [] } = useRoomMinibars(roomId || null)

  // Stock disponible = lo que hay en el minibar de la habitación
  // + lo que hay en el catálogo (stock_quantity o inventory_item.current_stock).
  // El backend (deductMinibarStock) descuenta primero del minibar de la
  // habitación y el resto sale del catálogo, así que ambos son fuentes válidas.
  const stockByProductId = useMemo(() => {
    const map = new Map<string, number>()
    for (const rm of roomMinibars) map.set(rm.minibar_product_id, rm.quantity)
    return map
  }, [roomMinibars])

  const totalStock = (p: MinibarProduct): number => {
    const roomQty = stockByProductId.get(p.id) ?? 0
    const catalogQty = p.inventory_item
      ? p.inventory_item.current_stock
      : p.stock_quantity
    return roomQty + catalogQty
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = products.filter(p => p.active)
    const matched = q
      ? base.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.code ?? '').toLowerCase().includes(q),
        )
      : base
    // Productos CON stock primero (ordenados por stock desc), después los agotados.
    return matched
      .map(p => ({ product: p, stock: totalStock(p) }))
      .sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0) || b.stock - a.stock)
      .slice(0, 50)
  }, [query, products, stockByProductId])

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar producto por nombre o código…"
        value={query}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
      />
      {show && (
        <div
          className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border shadow-lg"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Sin resultados
            </div>
          ) : filtered.map(({ product: p, stock }) => {
            const out = stock <= 0
            return (
              <button
                type="button"
                key={p.id}
                disabled={out}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { if (!out) onSelect(p, stock) }}
                className="w-full text-left px-3 py-1.5 text-xs disabled:cursor-not-allowed"
                style={{
                  background: selectedId === p.id ? 'var(--bg-input)' : 'transparent',
                  color: out ? 'var(--text-muted)' : 'var(--text-primary)',
                  opacity: out ? 0.55 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {p.code && <span style={{ color: 'var(--text-muted)' }}>{p.code} · </span>}
                    {p.name}
                  </span>
                  {out ? (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                      style={{ background: '#FEE2E2', color: '#991B1B' }}
                    >
                      AGOTADO
                    </span>
                  ) : (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 tabular-nums"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                      title={`${stock} unidad(es) en esta habitación`}
                    >
                      {stock}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
