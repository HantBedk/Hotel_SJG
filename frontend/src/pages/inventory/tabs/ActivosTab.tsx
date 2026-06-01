import { useState } from 'react'
import { Plus, Search, Pencil, Archive, X } from 'lucide-react'
import { useAssets, useAssetMutations } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import type { Asset, AssetLocationType, AssetStatus } from '@/types'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO')
}

const STATUS_STYLES: Record<AssetStatus, { label: string; bg: string; color: string }> = {
  active:      { label: 'Activo',       bg: '#F0FDF4', color: '#16A34A' },
  maintenance: { label: 'Mantenimiento', bg: '#FFFBEB', color: '#D97706' },
  retired:     { label: 'Retirado',     bg: '#F8F8F8', color: '#6B7280' },
}

// ── Asset form ────────────────────────────────────────────────────────────────
interface AssetFormProps {
  asset?: Asset | null
  onSave: (data: Partial<Asset>) => void
  onClose: () => void
  saving: boolean
}

function AssetForm({ asset, onSave, onClose, saving }: AssetFormProps) {
  const [form, setForm] = useState({
    name:          asset?.name ?? '',
    brand:         asset?.brand ?? '',
    model:         asset?.model ?? '',
    serial_number: asset?.serial_number ?? '',
    location_type: (asset?.location_type ?? 'general') as AssetLocationType,
    purchase_date: asset?.purchase_date ?? '',
    warranty_expiry: asset?.warranty_expiry ?? '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{asset ? 'Editar activo' : 'Nuevo activo'}</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form) }}
          className="p-6 grid grid-cols-2 gap-4"
        >
          {[
            { key: 'name',            label: 'Nombre *',          required: true,  span: 2 },
            { key: 'brand',           label: 'Marca',             required: false },
            { key: 'model',           label: 'Modelo',            required: false },
            { key: 'serial_number',   label: 'Número de serie',   required: false },
            { key: 'purchase_date',   label: 'Fecha compra',      required: false, type: 'date' },
            { key: 'warranty_expiry', label: 'Garantía hasta',    required: false, type: 'date' },
          ].map(({ key, label, required, type = 'text', span }) => (
            <div key={key} className={span === 2 ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input
                type={type}
                required={required}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ubicación</label>
            <select
              value={form.location_type}
              onChange={(e) => set('location_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="general">General</option>
              <option value="room">Habitación</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
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
export default function ActivosTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalAsset, setModalAsset] = useState<Asset | null | undefined>(undefined)

  const { data, isLoading } = useAssets({ search: search || undefined, status: statusFilter || undefined })
  const assets = data?.data ?? []

  const { createMutation, updateMutation, retireMutation } = useAssetMutations()

  const handleSave = (formData: Partial<Asset>) => {
    if (modalAsset?.id) {
      updateMutation.mutate({ id: modalAsset.id, data: formData }, { onSuccess: () => setModalAsset(undefined) })
    } else {
      createMutation.mutate(formData, { onSuccess: () => setModalAsset(undefined) })
    }
  }

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Buscar por nombre, código, serie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="retired">Retirado</option>
        </select>
        {canManage && (
          <button onClick={() => setModalAsset(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={14} />Nuevo
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin activos.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {['Código', 'Nombre', 'Marca / Modelo', 'Ubicación', 'Garantía', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const s = STATUS_STYLES[asset.status]
                return (
                  <tr key={asset.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{asset.asset_code}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{asset.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {asset.location_type === 'room' ? `Hab. ${asset.room?.number ?? '—'}` : 'General'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(asset.warranty_expiry)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setModalAsset(asset)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Pencil size={14} />
                          </button>
                          {asset.status !== 'retired' && (
                            <button
                              onClick={() => { if (confirm('¿Retirar este activo?')) retireMutation.mutate(asset.id) }}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500">
                              <Archive size={14} />
                            </button>
                          )}
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

      {modalAsset !== undefined && (
        <AssetForm
          asset={modalAsset}
          onSave={handleSave}
          onClose={() => setModalAsset(undefined)}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}
