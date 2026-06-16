import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Archive, X } from 'lucide-react'
import { useAssets, useAssetMutations } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { cn } from '@/lib/cn'
import type { Asset, AssetLocationType, AssetStatus } from '@/types'

const TABLE_HEADERS = ['Código', 'Nombre', 'Marca / Modelo', 'Ubicación', 'Garantía', 'Estado', ''] as const

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO')
}

const STATUS_STYLES: Record<AssetStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Activo', bg: '#F0FDF4', color: '#16A34A' },
  maintenance: { label: 'Mantenimiento', bg: '#FFFBEB', color: '#D97706' },
  retired: { label: 'Retirado', bg: '#F8F8F8', color: '#6B7280' },
}

interface AssetFormState {
  name: string
  brand: string
  model: string
  serial_number: string
  location_type: AssetLocationType
  purchase_date: string
  warranty_expiry: string
}

const ASSET_FORM_FIELDS: {
  key: keyof AssetFormState
  label: string
  required: boolean
  type?: string
  span?: number
}[] = [
  { key: 'name', label: 'Nombre *', required: true, span: 2 },
  { key: 'brand', label: 'Marca', required: false },
  { key: 'model', label: 'Modelo', required: false },
  { key: 'serial_number', label: 'Número de serie', required: false },
  { key: 'purchase_date', label: 'Fecha compra', required: false, type: 'date' },
  { key: 'warranty_expiry', label: 'Garantía hasta', required: false, type: 'date' },
]

interface AssetFormProps {
  readonly asset?: Asset | null
  readonly onSave: (data: Partial<Asset>) => void
  readonly onClose: () => void
  readonly saving: boolean
}

function AssetForm({ asset, onSave, onClose, saving }: AssetFormProps) {
  const [form, setForm] = useState<AssetFormState>({
    name: asset?.name ?? '',
    brand: asset?.brand ?? '',
    model: asset?.model ?? '',
    serial_number: asset?.serial_number ?? '',
    location_type: asset?.location_type ?? 'general',
    purchase_date: asset?.purchase_date ?? '',
    warranty_expiry: asset?.warranty_expiry ?? '',
  })

  const setField = <K extends keyof AssetFormState>(key: K, value: AssetFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const dialogLabel = asset ? 'Editar activo' : 'Nuevo activo'
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
        className="relative z-10 pointer-events-auto w-full max-w-lg rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{dialogLabel}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form) }}
          className="p-6 grid grid-cols-2 gap-4"
        >
          {ASSET_FORM_FIELDS.map(({ key, label, required, type = 'text', span }) => {
            const inputId = `asset-field-${key}`
            return (
              <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                <label htmlFor={inputId} className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </label>
                <input
                  id={inputId}
                  type={type}
                  required={required}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
            )
          })}
          <div>
            <label htmlFor="asset-location-type" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Ubicación
            </label>
            <select
              id="asset-location-type"
              value={form.location_type}
              onChange={(e) => setField('location_type', e.target.value === 'room' ? 'room' : 'general')}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="general">General</option>
              <option value="room">Habitación</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
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
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

export default function ActivosTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_inventory')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalAsset, setModalAsset] = useState<Asset | null | undefined>(undefined)
  const [retireTarget, setRetireTarget] = useState<Asset | null>(null)

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

  let tableContent
  if (isLoading) {
    tableContent = (
      <div className="py-4"><SkeletonTable rows={5} cols={5} /></div>
    )
  } else if (assets.length === 0) {
    tableContent = (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Sin activos.</div>
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
            {assets.map((asset) => {
              const s = STATUS_STYLES[asset.status]
              return (
                <tr
                  key={asset.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
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
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => setModalAsset(asset)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label="Editar activo"
                        >
                          <Pencil size={14} />
                        </button>
                        {asset.status !== 'retired' && (
                          <button
                            type="button"
                            onClick={() => setRetireTarget(asset)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                            aria-label="Retirar activo"
                          >
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
    )
  }

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      <div className="flex flex-wrap items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div
          className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
        >
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
          <button
            type="button"
            onClick={() => setModalAsset(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium ml-auto"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={14} />Nuevo
          </button>
        )}
      </div>

      {tableContent}

      {modalAsset !== undefined && (
        <AssetForm
          asset={modalAsset}
          onSave={handleSave}
          onClose={() => setModalAsset(undefined)}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <DeleteConfirmDialog
        target={retireTarget}
        title="Retirar activo"
        message={
          retireTarget
            ? `¿Estás seguro de retirar ${retireTarget.name}?`
            : ''
        }
        confirmLabel="Sí, retirar"
        loading={retireMutation.isPending}
        onConfirm={(asset) => retireMutation.mutate(asset.id, { onSuccess: () => setRetireTarget(null) })}
        onClose={() => setRetireTarget(null)}
      />
    </div>
  )
}
