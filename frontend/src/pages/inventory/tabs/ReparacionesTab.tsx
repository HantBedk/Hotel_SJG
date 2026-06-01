import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useRepairOrders, useRepairOrderMutations, useAssets } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import type { RepairOrder, RepairOrderStatus } from '@/types'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO')
}

function formatCurrency(v: string | number | null) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

const STATUS_STYLES: Record<RepairOrderStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Pendiente',   bg: '#FFFBEB', color: '#D97706' },
  in_progress: { label: 'En progreso', bg: '#EFF6FF', color: '#2563EB' },
  completed:   { label: 'Cerrada',     bg: '#F0FDF4', color: '#16A34A' },
}

// ── Create order modal ────────────────────────────────────────────────────────
interface CreateOrderModalProps {
  onSave: (data: { asset_id?: string; description: string }) => void
  onClose: () => void
  saving: boolean
  assets: Array<{ id: string; asset_code: string; name: string }>
}

function CreateOrderModal({ onSave, onClose, saving, assets }: CreateOrderModalProps) {
  const [assetId, setAssetId] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nueva orden de reparación</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ asset_id: assetId || undefined, description })
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Activo (opcional)</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
              <option value="">Sin activo específico</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.asset_code} — {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descripción del problema *</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Close order modal ─────────────────────────────────────────────────────────
interface CloseOrderModalProps {
  order: RepairOrder
  onSave: (data: { cost?: number; notes?: string }) => void
  onClose: () => void
  saving: boolean
}

function CloseOrderModal({ order, onSave, onClose, saving }: CloseOrderModalProps) {
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Cerrar orden — {order.asset?.name ?? 'Reparación'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Costo final</label>
            <input type="number" min="0" step="any" value={cost} onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={() => onSave({ cost: cost ? Number(cost) : undefined, notes: notes || undefined })}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Cerrar orden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function ReparacionesTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [closing, setClosing] = useState<RepairOrder | null>(null)

  const { data, isLoading } = useRepairOrders({ status: statusFilter || undefined })
  const orders = data?.data ?? []

  const { data: assetsData } = useAssets()
  const assets = assetsData?.data ?? []

  const { createMutation, closeMutation } = useRepairOrderMutations()

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
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
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
          style={{ background: 'var(--color-primary)' }}>
          <Plus size={14} />Nueva orden
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin órdenes de reparación.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {['Activo / Habitación', 'Descripción', 'Reportado', 'Asignado a', 'Costo', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
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
                      {o.asset?.name ?? (o.room ? `Hab. ${o.room.number}` : '—')}
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
      )}

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
