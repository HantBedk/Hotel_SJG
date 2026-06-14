import { useMemo, useState } from 'react'
import {
  Search, Plus, Minus, Trash2, X, ShoppingCart, Banknote, CreditCard,
  ArrowRightLeft, Receipt, Clock, XCircle, FileText,
} from 'lucide-react'
import { useMinibarProducts } from '@/hooks/useInventory'
import { useMinibarSales, useMinibarSaleMutations } from '@/hooks/useMinibarSales'
import { formatCOP } from '@/lib/format'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import type {
  MinibarProduct,
  MinibarSale,
  MinibarSalePaymentMethod,
  MinibarSaleStatus,
} from '@/types'

interface CartItem {
  productId: string
  name: string
  code: string | null
  unitPrice: number
  qty: number
  stockAvailable: number
}

const METHOD_LABEL: Record<MinibarSalePaymentMethod, string> = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  card:     'Tarjeta',
}

const METHOD_ICON: Record<MinibarSalePaymentMethod, React.ElementType> = {
  cash:     Banknote,
  transfer: ArrowRightLeft,
  card:     CreditCard,
}

const STATUS_LABEL: Record<MinibarSaleStatus, string> = {
  pending:   'Pendiente',
  paid:      'Pagada',
  cancelled: 'Cancelada',
}

const STATUS_COLOR: Record<MinibarSaleStatus, { bg: string; fg: string }> = {
  pending:   { bg: '#FEF3C7', fg: '#B45309' },
  paid:      { bg: '#D1FAE5', fg: '#047857' },
  cancelled: { bg: '#FEE2E2', fg: '#B91C1C' },
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

function availableStock(p: MinibarProduct): number {
  // Para venta directa: el stock vendible viene de la bodega (catálogo o ítem
  // de inventario vinculado). Lo que está físicamente en habitaciones no se
  // puede vender al público.
  if (p.inventory_item) return p.inventory_item.current_stock
  return p.stock_quantity
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
interface CatalogProps {
  products: MinibarProduct[]
  loading: boolean
  cartById: Map<string, CartItem>
  onAdd: (p: MinibarProduct) => void
}

function Catalog({ products, loading, cartById, onAdd }: CatalogProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => p.active)
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.code ?? '').toLowerCase().includes(q) ||
          (p.presentation ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, search])

  return (
    <div
      className="rounded-xl border flex flex-col h-full min-h-0"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o presentación…"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay productos que coincidan.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const stock     = availableStock(p)
              const inCart    = cartById.get(p.id)?.qty ?? 0
              const remaining = stock - inCart
              const sold      = remaining <= 0
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !sold && onAdd(p)}
                  disabled={sold}
                  className="text-left rounded-lg p-3 border transition-all flex flex-col gap-1.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: sold ? 'var(--bg-input)' : 'var(--bg-surface)',
                    borderColor: inCart > 0 ? 'var(--color-primary)' : 'var(--border-default)',
                  }}
                  title={sold ? 'Sin stock disponible' : `Agregar ${p.name}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    {inCart > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        ×{inCart}
                      </span>
                    )}
                  </div>
                  {p.presentation && (
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {p.presentation}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      {formatCOP(Number(p.sale_price))}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: remaining > 5 ? '#F0FDF4' : remaining > 0 ? '#FEF3C7' : '#FEF2F2',
                        color:      remaining > 5 ? '#15803D' : remaining > 0 ? '#B45309' : '#B91C1C',
                      }}
                    >
                      {remaining > 0 ? `Stock ${remaining}` : 'Agotado'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Carrito ───────────────────────────────────────────────────────────────────
interface CartProps {
  items: CartItem[]
  customerName: string
  customerDocument: string
  notes: string
  saving: boolean
  onSetCustomerName: (v: string) => void
  onSetCustomerDocument: (v: string) => void
  onSetNotes: (v: string) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onSavePending: () => void
  onCharge: () => void
}

function Cart({
  items, customerName, customerDocument, notes, saving,
  onSetCustomerName, onSetCustomerDocument, onSetNotes,
  onIncrement, onDecrement, onRemove, onClear,
  onSavePending, onCharge,
}: CartProps) {
  const total = items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0)
  const empty = items.length === 0

  return (
    <div
      className="rounded-xl border flex flex-col h-full min-h-0"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Carrito
          </span>
          {!empty && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {items.length}
            </span>
          )}
        </div>
        {!empty && (
          <button
            onClick={onClear}
            className="text-xs flex items-center gap-1 hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={12} /> Vaciar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {empty ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            Selecciona productos del catálogo para agregar al carrito.
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.productId}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{ background: 'var(--bg-input)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {it.name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {formatCOP(it.unitPrice)} c/u · stock {it.stockAvailable}
                </p>
              </div>
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--border-default)' }}
              >
                <button
                  onClick={() => onDecrement(it.productId)}
                  className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Minus size={12} />
                </button>
                <span className="px-2 text-sm font-semibold min-w-[28px] text-center" style={{ color: 'var(--text-primary)' }}>
                  {it.qty}
                </span>
                <button
                  onClick={() => onIncrement(it.productId)}
                  disabled={it.qty >= it.stockAvailable}
                  className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--text-secondary)' }}
                  title={it.qty >= it.stockAvailable ? 'Sin más stock disponible' : 'Agregar uno más'}
                >
                  <Plus size={12} />
                </button>
              </div>
              <span className="text-sm font-bold w-20 text-right" style={{ color: 'var(--text-primary)' }}>
                {formatCOP(it.unitPrice * it.qty)}
              </span>
              <button
                onClick={() => onRemove(it.productId)}
                className="p-1 rounded hover:bg-red-50 text-red-500"
                title="Quitar del carrito"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div
        className="p-3 border-t space-y-3"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Cliente (opcional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => onSetCustomerName(e.target.value)}
              placeholder="Nombre"
              className="w-full px-2 py-1.5 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Documento (opcional)
            </label>
            <input
              type="text"
              value={customerDocument}
              onChange={(e) => onSetCustomerDocument(e.target.value)}
              placeholder="CC / NIT"
              className="w-full px-2 py-1.5 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Notas
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onSetNotes(e.target.value)}
            placeholder="Observaciones"
            className="w-full px-2 py-1.5 rounded-lg border text-sm"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {formatCOP(total)}
          </span>
        </div>

        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          El stock se descuenta sólo al cobrar. Si guardas pendiente, el catálogo no se toca hasta el pago.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onSavePending}
            disabled={empty || saving}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
          >
            Guardar pendiente
          </button>
          <button
            onClick={onCharge}
            disabled={empty || saving}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-primary)' }}
          >
            <Receipt size={14} />
            Cobrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de cobro ────────────────────────────────────────────────────────────
interface ChargeModalProps {
  open: boolean
  total: number
  saving: boolean
  onClose: () => void
  onConfirm: (method: MinibarSalePaymentMethod) => void
}

function ChargeModal({ open, total, saving, onClose, onConfirm }: ChargeModalProps) {
  const [method, setMethod] = useState<MinibarSalePaymentMethod>('cash')

  return (
    <Modal open={open} onClose={onClose} size="sm" ariaLabel="Cobrar venta">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Cobrar venta
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Al confirmar se descuenta el stock del catálogo.
        </p>
      </div>

      <div className="px-5 pb-2 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total a cobrar</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {formatCOP(total)}
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Método de pago
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'transfer', 'card'] as MinibarSalePaymentMethod[]).map((m) => {
              const Icon = METHOD_ICON[m]
              const active = method === m
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all"
                  style={{
                    borderColor: active ? 'var(--color-primary)' : 'var(--border-default)',
                    background: active ? 'var(--color-primary-light, #EFF6FF)' : 'var(--bg-surface)',
                    color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium">{METHOD_LABEL[m]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-4 mt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-40"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(method)}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}
        >
          {saving ? 'Procesando…' : 'Confirmar pago'}
        </button>
      </div>
    </Modal>
  )
}

// ── Detalle de venta ──────────────────────────────────────────────────────────
interface SaleDetailModalProps {
  sale: MinibarSale | null
  onClose: () => void
}

function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  if (!sale) return null
  const color = STATUS_COLOR[sale.status]

  return (
    <Modal open={!!sale} onClose={onClose} size="lg" ariaLabel="Detalle de venta">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Venta {sale.sale_number}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Registrada {formatDateTime(sale.created_at)}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: color.bg, color: color.fg }}
        >
          {STATUS_LABEL[sale.status]}
        </span>
      </div>

      <div className="px-5 pb-3 space-y-3 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>{sale.customer_name ?? '—'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Documento:</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>{sale.customer_document ?? '—'}</span>
          </div>
          {sale.status === 'paid' && (
            <>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Pagado:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{formatDateTime(sale.paid_at)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Método:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>
                  {sale.payment_method ? METHOD_LABEL[sale.payment_method] : '—'}
                </span>
              </div>
            </>
          )}
          {sale.status === 'cancelled' && (
            <>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Cancelada:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{formatDateTime(sale.cancelled_at)}</span>
              </div>
              <div className="col-span-2">
                <span style={{ color: 'var(--text-muted)' }}>Motivo:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{sale.cancellation_reason ?? '—'}</span>
              </div>
            </>
          )}
          {sale.notes && (
            <div className="col-span-2">
              <span style={{ color: 'var(--text-muted)' }}>Notas:</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>{sale.notes}</span>
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <th className="px-2 py-2 text-left font-medium">Producto</th>
              <th className="px-2 py-2 text-right font-medium">Cant.</th>
              <th className="px-2 py-2 text-right font-medium">Precio</th>
              <th className="px-2 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items ?? []).map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td className="px-2 py-2" style={{ color: 'var(--text-primary)' }}>
                  {it.product_code && (
                    <span className="text-[10px] font-mono mr-1" style={{ color: 'var(--text-muted)' }}>
                      [{it.product_code}]
                    </span>
                  )}
                  {it.product_name}
                </td>
                <td className="px-2 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{it.quantity}</td>
                <td className="px-2 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                  {formatCOP(Number(it.unit_price))}
                </td>
                <td className="px-2 py-2 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCOP(Number(it.total))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-2 py-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                Total:
              </td>
              <td className="px-2 py-3 text-right text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                {formatCOP(Number(sale.total))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end px-5 py-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ── Historial ─────────────────────────────────────────────────────────────────
interface HistoryProps {
  onPay: (sale: MinibarSale) => void
  onCancel: (sale: MinibarSale) => void
  onView: (sale: MinibarSale) => void
}

function HistorySection({ onPay, onCancel, onView }: HistoryProps) {
  const [statusFilter, setStatusFilter] = useState<MinibarSaleStatus | ''>('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  const filters = useMemo(() => ({
    status: statusFilter || undefined,
    search: search || undefined,
    from:   from || undefined,
    to:     to   || undefined,
    per_page: 50,
  }), [statusFilter, search, from, to])

  const { data, isLoading } = useMinibarSales(filters)
  const rows = data?.data ?? []

  return (
    <div
      className="rounded-xl border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div
        className="p-3 border-b flex flex-wrap items-center gap-2"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: 'var(--bg-input)' }}
        >
          {([['', 'Todas'], ['pending', 'Pendientes'], ['paid', 'Pagadas'], ['cancelled', 'Canceladas']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k as MinibarSaleStatus | '')}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={
                statusFilter === k
                  ? { background: 'var(--bg-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {l}
            </button>
          ))}
        </div>

        <div
          className="flex items-center gap-2 px-2 py-1 rounded-lg flex-1 min-w-[200px]"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
        >
          <Search size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° venta, cliente o documento…"
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center gap-1">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border bg-transparent"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border bg-transparent"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-4"><SkeletonTable rows={5} cols={6} /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          Sin ventas registradas.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <th className="px-3 py-2 text-left font-medium">N°</th>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-left font-medium">Cliente</th>
                <th className="px-3 py-2 text-left font-medium">Productos</th>
                <th className="px-3 py-2 text-left font-medium">Vendedor</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const color = STATUS_COLOR[s.status]
                const items = s.items ?? []
                const firstItem = items[0]
                const extraCount = items.length - 1
                return (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    style={{ borderBottom: '1px solid var(--border-default)' }}
                  >
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.sale_number}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatDateTime(s.created_at)}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                      {s.customer_name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      {s.customer_document && (
                        <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                          {s.customer_document}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                      {firstItem ? (
                        <>
                          <span>
                            {firstItem.product_name}
                            {firstItem.quantity > 1 && (
                              <span style={{ color: 'var(--text-muted)' }}> ×{firstItem.quantity}</span>
                            )}
                          </span>
                          {extraCount > 0 && (
                            <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                              y {extraCount} más
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                      {typeof s.registered_by === 'object' && s.registered_by?.name
                        ? s.registered_by.name
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatCOP(Number(s.total))}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: color.bg, color: color.fg }}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => onView(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Ver detalle"
                        >
                          <FileText size={13} />
                        </button>
                        {s.status === 'pending' && (
                          <button
                            onClick={() => onPay(s)}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                            style={{ background: 'var(--color-primary)' }}
                          >
                            Cobrar
                          </button>
                        )}
                        {s.status !== 'cancelled' && (
                          <button
                            onClick={() => onCancel(s)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                            title="Cancelar venta"
                          >
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
type Tab = 'pos' | 'history'

export default function MinibarSalesPage() {
  const [tab, setTab] = useState<Tab>('pos')

  const { data: products = [], isLoading: loadingProducts } = useMinibarProducts()
  const { createMutation, payMutation, cancelMutation } = useMinibarSaleMutations()

  // ── Estado del carrito (sólo en memoria hasta cobrar/guardar) ─────────────
  const [cart, setCart]                   = useState<CartItem[]>([])
  const [customerName, setCustomerName]   = useState('')
  const [customerDocument, setCustDoc]    = useState('')
  const [notes, setNotes]                 = useState('')
  const [chargeOpen, setChargeOpen]       = useState(false)

  const [detailSale, setDetailSale]   = useState<MinibarSale | null>(null)
  const [paySale, setPaySale]         = useState<MinibarSale | null>(null)
  const [cancelTarget, setCancelTarget] = useState<MinibarSale | null>(null)

  const cartById = useMemo(() => {
    const m = new Map<string, CartItem>()
    for (const it of cart) m.set(it.productId, it)
    return m
  }, [cart])

  const cartTotal = cart.reduce((s, it) => s + it.unitPrice * it.qty, 0)

  const productById = useMemo(() => {
    const m = new Map<string, MinibarProduct>()
    for (const p of products) m.set(p.id, p)
    return m
  }, [products])

  const handleAdd = (p: MinibarProduct) => {
    const stock = availableStock(p)
    setCart((prev) => {
      const existing = prev.find((it) => it.productId === p.id)
      if (existing) {
        if (existing.qty >= stock) return prev
        return prev.map((it) => it.productId === p.id ? { ...it, qty: it.qty + 1 } : it)
      }
      return [...prev, {
        productId: p.id,
        name: p.name,
        code: p.code,
        unitPrice: Number(p.sale_price),
        qty: 1,
        stockAvailable: stock,
      }]
    })
  }

  const handleIncrement = (id: string) => {
    const p = productById.get(id)
    if (!p) return
    const stock = availableStock(p)
    setCart((prev) => prev.map((it) =>
      it.productId === id && it.qty < stock ? { ...it, qty: it.qty + 1 } : it,
    ))
  }
  const handleDecrement = (id: string) => {
    setCart((prev) => prev.flatMap((it) => {
      if (it.productId !== id) return [it]
      if (it.qty <= 1) return []
      return [{ ...it, qty: it.qty - 1 }]
    }))
  }
  const handleRemove = (id: string) => setCart((prev) => prev.filter((it) => it.productId !== id))
  const resetCart = () => {
    setCart([])
    setCustomerName('')
    setCustDoc('')
    setNotes('')
  }

  const buildPayload = () => ({
    customer_name:     customerName.trim() || null,
    customer_document: customerDocument.trim() || null,
    notes:             notes.trim() || null,
    items: cart.map((it) => ({ minibar_product_id: it.productId, quantity: it.qty })),
  })

  const handleSavePending = () => {
    if (cart.length === 0) return
    createMutation.mutate(buildPayload(), {
      onSuccess: () => resetCart(),
    })
  }

  const handleConfirmCharge = (method: MinibarSalePaymentMethod) => {
    createMutation.mutate(buildPayload(), {
      onSuccess: (sale) => {
        payMutation.mutate({ id: sale.id, payment_method: method }, {
          onSuccess: () => {
            setChargeOpen(false)
            resetCart()
          },
        })
      },
    })
  }

  const handlePayExisting = (method: MinibarSalePaymentMethod) => {
    if (!paySale) return
    payMutation.mutate({ id: paySale.id, payment_method: method }, {
      onSuccess: () => setPaySale(null),
    })
  }

  const handleConfirmCancel = () => {
    if (!cancelTarget) return
    cancelMutation.mutate({ id: cancelTarget.id }, {
      onSuccess: () => setCancelTarget(null),
    })
  }

  const saving = createMutation.isPending || payMutation.isPending

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Venta de productos
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Punto de venta directo del catálogo para clientes externos. El stock se descuenta sólo al cobrar.
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-input)' }}>
          {(['pos', 'history'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
              style={
                tab === k
                  ? { background: 'var(--bg-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {k === 'pos' ? <><ShoppingCart size={13} /> Nueva venta</> : <><Clock size={13} /> Historial</>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pos' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 min-h-0">
            <Catalog
              products={products}
              loading={loadingProducts}
              cartById={cartById}
              onAdd={handleAdd}
            />
          </div>
          <div className="lg:col-span-1 min-h-0">
            <Cart
              items={cart}
              customerName={customerName}
              customerDocument={customerDocument}
              notes={notes}
              saving={saving}
              onSetCustomerName={setCustomerName}
              onSetCustomerDocument={setCustDoc}
              onSetNotes={setNotes}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onRemove={handleRemove}
              onClear={resetCart}
              onSavePending={handleSavePending}
              onCharge={() => setChargeOpen(true)}
            />
          </div>
        </div>
      ) : (
        <HistorySection
          onPay={(s) => setPaySale(s)}
          onCancel={(s) => setCancelTarget(s)}
          onView={(s) => setDetailSale(s)}
        />
      )}

      <ChargeModal
        open={chargeOpen}
        total={cartTotal}
        saving={saving}
        onClose={() => setChargeOpen(false)}
        onConfirm={handleConfirmCharge}
      />

      <ChargeModal
        open={!!paySale}
        total={paySale ? Number(paySale.total) : 0}
        saving={payMutation.isPending}
        onClose={() => setPaySale(null)}
        onConfirm={handlePayExisting}
      />

      <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar venta"
        message={
          cancelTarget?.status === 'paid'
            ? <>La venta <b>{cancelTarget?.sale_number}</b> está pagada. Al cancelar se devolverá el stock al catálogo. ¿Continuar?</>
            : <>¿Cancelar la venta <b>{cancelTarget?.sale_number}</b>? No se ha descontado stock.</>
        }
        confirmLabel="Sí, cancelar"
        loading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}
