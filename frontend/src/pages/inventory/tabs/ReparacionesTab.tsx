import { useState, useEffect, type SubmitEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { useRepairOrders, useRepairOrderMutations, useAssets } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { RepairOrder, RepairOrderStatus } from '@/types'

const TABLE_HEADERS = ['Activo / Habitación', 'Descripción', 'Reportado', 'Asignado a', 'Costo', 'Estado', ''] as const

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO')
}

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

function optionalCost(value: string): number | undefined {
  if (!value.trim()) return undefined
  return Number.parseFloat(value)
}

const STATUS_STYLES: Record<RepairOrderStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Pendiente',   bg: '#FFFBEB', color: '#D97706' },
  in_progress: { label: 'En progreso', bg: '#EFF6FF', color: '#2563EB' },
  completed:   { label: 'Cerrada',     bg: '#F0FDF4', color: '#16A34A' },
}

function emptyOrdersMessage(roomIdFilter: string | undefined): string {
  if (roomIdFilter) return 'Sin órdenes de mantenimiento para esta habitación.'
  return 'Sin órdenes de reparación.'
}

function roomFilterLabel(orders: RepairOrder[], roomIdFilter: string | undefined): string | null {
  if (!roomIdFilter) return null
  const room = orders.at(0)?.room
  if (room) return `Hab. ${room.number}`
  return 'esta habitación'
}

function orderTargetLabel(order: RepairOrder): string {
  if (order.asset?.name) return order.asset.name
  if (order.room) return `Hab. ${order.room.number}`
  return '—'
}

// ── Create order modal ────────────────────────────────────────────────────────
interface CreateOrderModalProps {
  readonly onSave: (data: { asset_id?: string; description: string }) => void
  readonly onClose: () => void
  readonly saving: boolean
  readonly assets: Array<{ id: string; asset_code: string; name: string }>
}

function CreateOrderModal({ onSave, onClose, saving, assets }: CreateOrderModalProps) {
  const [assetId, setAssetId] = useState('')
  const [description, setDescription] = useState('')
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({ asset_id: assetId || undefined, description })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Nueva orden de reparación"
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
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nueva orden de reparación</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="repair-order-asset" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Activo (opcional)
            </label>
            <select
              id="repair-order-asset"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Sin activo específico</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.asset_code} — {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="repair-order-description" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Descripción del problema *
            </label>
            <textarea
              id="repair-order-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              {saving ? 'Guardando…' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

// ── Close order modal ─────────────────────────────────────────────────────────
interface CloseOrderModalProps {
  readonly order: RepairOrder
  readonly onSave: (data: { cost?: number; notes?: string }) => void
  readonly onClose: () => void
  readonly saving: boolean
}

function CloseOrderModal({ order, onSave, onClose, saving }: CloseOrderModalProps) {
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  const handleClose = () => {
    onSave({
      cost: optionalCost(cost),
      notes: notes.trim() || undefined,
    })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Cerrar orden — ${order.asset?.name ?? 'Reparación'}`}
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
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Cerrar orden — {order.asset?.name ?? 'Reparación'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="close-order-cost" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Costo final
            </label>
            <input
              id="close-order-cost"
              type="number"
              min="0"
              step="any"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label htmlFor="close-order-notes" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Notas
            </label>
            <textarea
              id="close-order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
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
              disabled={saving}
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              {saving ? 'Guardando…' : 'Cerrar orden'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function ReparacionesTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')
  const [searchParams] = useSearchParams()
  const roomIdFilter = searchParams.get('room_id') ?? undefined

  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [closing, setClosing] = useState<RepairOrder | null>(null)

  const { data, isLoading } = useRepairOrders({
    status: statusFilter || undefined,
    room_id: roomIdFilter,
  })
  const orders = data?.data ?? []

  const { data: assetsData } = useAssets()
  const assets = assetsData?.data ?? []

  const { createMutation, closeMutation } = useRepairOrderMutations()

  let tableContent
  if (isLoading) {
    tableContent = (
      <div className="py-4"><SkeletonTable rows={5} cols={5} /></div>
    )
  } else if (orders.length === 0) {
    tableContent = (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        {emptyOrdersMessage(roomIdFilter)}
      </div>
    )
  } else {
    tableContent = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
              {TABLE_HEADERS.map((h) => (
                <th key={h || 'actions'} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const s = STATUS_STYLES[o.status]
              return (
                <tr key={o.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {orderTargetLabel(o)}
                    {o.asset && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.asset.asset_code}</p>}
                  </td>
                  <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                    <p className="truncate">{o.description}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {o.reported_by_user?.name ?? '—'}
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {o.assigned_to_user?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{formatCurrency(o.cost)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && o.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setClosing(o)}
                        className="text-xs px-2 py-1 rounded-lg border transition-colors"
                        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                        Cerrar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const roomLabel = roomFilterLabel(orders, roomIdFilter)

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      {roomLabel && (
        <div
          className="px-4 py-2 text-xs border-b"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
        >
          Mostrando órdenes de mantenimiento de {roomLabel}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="">Todas</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Cerradas</option>
        </select>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
          style={{ background: 'var(--color-primary)' }}>
          <Plus size={14} />Nueva orden
        </button>
      </div>

      {tableContent}

      {showCreate && (
        <CreateOrderModal
          assets={assets}
          onSave={(data) => {
            createMutation.mutate(data, { onSuccess: () => setShowCreate(false) })
          }}
          onClose={() => setShowCreate(false)}
          saving={createMutation.isPending}
        />
      )}

      {closing && (
        <CloseOrderModal
          order={closing}
          onSave={(data) => {
            closeMutation.mutate({ id: closing.id, data }, { onSuccess: () => setClosing(null) })
          }}
          onClose={() => setClosing(null)}
          saving={closeMutation.isPending}
        />
      )}
    </div>
  )
}
