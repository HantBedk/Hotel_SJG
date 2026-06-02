import { useState } from 'react'
import { Plus, CheckCircle2, X } from 'lucide-react'
import { useMaintenances, useMaintenanceMutations, useAssets } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import type { AssetMaintenance, MaintenanceStatus } from '@/types'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO')
}

function formatCurrency(v: string | number | null) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-CO')}`
}

const STATUS_STYLES: Record<MaintenanceStatus, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pendiente',  bg: '#FFFBEB', color: '#D97706' },
  completed: { label: 'Completado', bg: '#F0FDF4', color: '#16A34A' },
  cancelled: { label: 'Cancelado',  bg: '#F9FAFB', color: '#6B7280' },
}

// ── Add maintenance modal ─────────────────────────────────────────────────────
interface AddMaintenanceModalProps {
  onSave: (assetId: string, data: { scheduled_date: string; description: string }) => void
  onClose: () => void
  saving: boolean
  assets: Array<{ id: string; asset_code: string; name: string }>
}

function AddMaintenanceModal({ onSave, onClose, saving, assets }: AddMaintenanceModalProps) {
  const [assetId, setAssetId] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Programar mantenimiento</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(assetId, { scheduled_date: date, description }) }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Activo *</label>
            <select required value={assetId} onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
              <option value="">Seleccionar…</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.asset_code} — {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha programada *</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descripción *</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
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
              {saving ? 'Guardando…' : 'Programar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Complete modal ────────────────────────────────────────────────────────────
interface CompleteModalProps {
  maint: AssetMaintenance
  onSave: (data: { completed_date?: string; cost?: number; notes?: string }) => void
  onClose: () => void
  saving: boolean
}

function CompleteModal({ maint, onSave, onClose, saving }: CompleteModalProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Completar — {maint.asset?.name}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha completado</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Costo</label>
            <input type="number" min="0" step="any" value={cost} onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
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
              onClick={() => onSave({ completed_date: date, cost: cost ? Number(cost) : undefined, notes: notes || undefined })}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}>
              {saving ? 'Guardando…' : 'Completar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function MantenimientosTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [completing, setCompleting] = useState<AssetMaintenance | null>(null)

  const { data, isLoading } = useMaintenances({ status: statusFilter || undefined })
  const maintenances = data?.data ?? []

  const { data: assetsData } = useAssets({ status: 'active' })
  const assets = assetsData?.data ?? []

  const { addMutation, completeMutation } = useMaintenanceMutations()

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      <div className="flex flex-wrap items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        {canManage && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={14} />Programar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : maintenances.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin mantenimientos.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {['Activo', 'Descripción', 'Programado', 'Completado', 'Costo', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maintenances.map((m) => {
                const s = STATUS_STYLES[m.status]
                return (
                  <tr key={m.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {m.asset?.name ?? '—'}
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.asset?.asset_code}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                      <p className="truncate">{m.description}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(m.scheduled_date)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(m.completed_date)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{formatCurrency(m.cost)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && m.status === 'pending' && (
                        <button onClick={() => setCompleting(m)}
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-green-600"
                          title="Marcar como completado">
                          <CheckCircle2 size={16} />
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

      {showAdd && (
        <AddMaintenanceModal
          assets={assets}
          onSave={(assetId, data) => {
            addMutation.mutate({ assetId, data }, { onSuccess: () => setShowAdd(false) })
          }}
          onClose={() => setShowAdd(false)}
          saving={addMutation.isPending}
        />
      )}

      {completing && (
        <CompleteModal
          maint={completing}
          onSave={(data) => {
            completeMutation.mutate({ id: completing.id, data }, { onSuccess: () => setCompleting(null) })
          }}
          onClose={() => setCompleting(null)}
          saving={completeMutation.isPending}
        />
      )}
    </div>
  )
}
