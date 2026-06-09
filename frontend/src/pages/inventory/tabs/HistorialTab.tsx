import { useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, ShoppingBag } from 'lucide-react'
import { useInventoryHistory } from '@/hooks/useInventory'
import { SkeletonText } from '@/components/ui/Skeleton'
import type { InventoryMovementType } from '@/types'
import type { HistoryFilters as ServiceHistoryFilters } from '@/services/inventory.service'

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const TYPE_META: Record<InventoryMovementType, { label: string; color: string; bg: string; sign: '+' | '-' | '±' }> = {
  entry:                       { label: 'Compra / Entrada',        color: '#16a34a', bg: '#dcfce7', sign: '+' },
  exit_to_minibar:             { label: 'Salida a Minibar',        color: '#7c3aed', bg: '#ede9fe', sign: '-' },
  exit_to_housekeeping:        { label: 'Salida a Limpieza',       color: '#0369a1', bg: '#e0f2fe', sign: '-' },
  adjustment:                  { label: 'Ajuste de stock',         color: '#d97706', bg: '#fef3c7', sign: '±' },
  sale:                        { label: 'Venta directa',           color: '#be185d', bg: '#fce7f3', sign: '-' },
  minibar_consumed:            { label: 'Consumo minibar',         color: '#6d28d9', bg: '#ede9fe', sign: '-' },
  minibar_damaged:             { label: 'Daño en minibar',         color: '#b91c1c', bg: '#fee2e2', sign: '-' },
  minibar_missing:             { label: 'Faltante minibar',        color: '#92400e', bg: '#fef3c7', sign: '-' },
  minibar_catalog_entry:       { label: 'Ingreso al catálogo',     color: '#16a34a', bg: '#dcfce7', sign: '+' },
  minibar_catalog_adjustment:  { label: 'Ajuste catálogo minibar', color: '#d97706', bg: '#fef3c7', sign: '±' },
  minibar_restock:             { label: 'Reposición minibar',      color: '#0369a1', bg: '#e0f2fe', sign: '+' },
  minibar_return:              { label: 'Devolución minibar',      color: '#0891b2', bg: '#cffafe', sign: '+' },
}

const SOURCE_OPTIONS = [
  { value: 'all',      label: 'Todos los movimientos' },
  { value: 'inventory', label: 'Solo inventario' },
  { value: 'minibar',  label: 'Solo minibar' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtMoney(v: string | null) {
  if (!v) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function HistorialTab() {
  const [search,   setSearch]   = useState('')
  const [source,   setSource]   = useState<ServiceHistoryFilters['source']>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [page,     setPage]     = useState(1)

  const filters: ServiceHistoryFilters = {
    source,
    page,
    ...(search.trim()   && { search: search.trim() }),
    ...(dateFrom        && { date_from: dateFrom }),
    ...(dateTo          && { date_to: dateTo }),
  }

  const { data, isLoading } = useInventoryHistory(filters)
  const movements = data?.data ?? []
  const meta      = data?.meta

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-4">
      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Filtros</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="Buscar producto..."
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage() }}
            />
          </div>

          {/* Fuente */}
          <select
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            value={source}
            onChange={e => { setSource(e.target.value as ServiceHistoryFilters['source']); resetPage() }}
          >
            {SOURCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Desde */}
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); resetPage() }}
              title="Desde"
            />
          </div>

          {/* Hasta */}
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); resetPage() }}
              title="Hasta"
            />
          </div>
        </div>

        {(search || dateFrom || dateTo || source !== 'all') && (
          <button
            onClick={() => { setSearch(''); setSource('all'); setDateFrom(''); setDateTo(''); resetPage() }}
            className="text-xs"
            style={{ color: 'var(--color-primary)' }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {isLoading ? (
          <div className="p-5"><SkeletonText lines={8} /></div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <SlidersHorizontal size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin movimientos para los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th className="text-left px-4 py-3 font-medium">Fecha y hora</th>
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium">Producto</th>
                  <th className="text-right px-4 py-3 font-medium">Cantidad</th>
                  <th className="text-right px-4 py-3 font-medium">Valor total</th>
                  <th className="text-left px-4 py-3 font-medium">Realizado por</th>
                  <th className="text-left px-4 py-3 font-medium">Destino / Hab.</th>
                  <th className="text-left px-4 py-3 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const meta = TYPE_META[m.type] ?? { label: m.type, color: 'var(--text-secondary)', bg: 'var(--bg-main)', sign: '±' as const }
                  const isEntry = meta.sign === '+'
                  const isAdj   = meta.sign === '±'

                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid var(--border-default)' }}
                      className="hover:opacity-90 transition-opacity"
                    >
                      {/* Fecha */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                        {fmtDate(m.occurred_at)}
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {m.source === 'minibar_consumption'
                            ? <ShoppingBag size={9} />
                            : isEntry
                              ? <ArrowDownCircle size={9} />
                              : isAdj
                                ? <SlidersHorizontal size={9} />
                                : <ArrowUpCircle size={9} />
                          }
                          {meta.label}
                        </span>
                      </td>

                      {/* Producto */}
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.item_name}</p>
                        {m.item_code && (
                          <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.item_code}</p>
                        )}
                        {m.item_presentation && (
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.item_presentation}</p>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{
                        color: isEntry ? '#16a34a' : isAdj ? '#d97706' : '#dc2626',
                      }}>
                        {isEntry ? '+' : isAdj ? (m.quantity >= 0 ? '+' : '') : '-'}
                        {Math.abs(m.quantity)}
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {fmtMoney(m.total_value)}
                      </td>

                      {/* Realizado por */}
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {m.performed_by ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>

                      {/* Destino */}
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {m.destination ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>

                      {/* Notas */}
                      <td className="px-4 py-3 max-w-[160px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="line-clamp-2">{m.notes ?? '—'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginación ───────────────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {meta.total} movimiento{meta.total !== 1 ? 's' : ''} · página {meta.current_page} de {meta.last_page}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-70 transition-opacity"
                style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-70 transition-opacity"
                style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 px-1">
        {(Object.entries(TYPE_META) as [InventoryMovementType, typeof TYPE_META[InventoryMovementType]][]).map(([, m]) => (
          <span
            key={m.label}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: m.bg, color: m.color }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}
