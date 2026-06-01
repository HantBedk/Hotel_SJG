import { useState } from 'react'
import { Save } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

const GROUPS   = [
  { key: 'hotel',  label: 'Hotel' },
  { key: 'system', label: 'Sistema' },
  { key: 'backup', label: 'Backups' },
]

const LABELS: Record<string, string> = {
  'hotel.iva_enabled':       'IVA habilitado',
  'hotel.iva_rate':          'Tasa IVA (%)',
  'hotel.check_in_time':     'Hora check-in',
  'hotel.check_out_time':    'Hora check-out',
  'hotel.currency':          'Moneda',
  'hotel.country':           'País',
  'hotel.late_checkout_fee': 'Recargo checkout tardío (COP)',
  'system.date_format':      'Formato de fecha',
  'system.time_format':      'Formato de hora',
  'backup.auto_backup':      'Backup automático',
  'backup.retention_days':   'Retención de backups (días)',
}

export default function SettingsPage() {
  const { hasPermission }  = useAuth()
  const canEdit            = hasPermission('manage_settings')
  const [group, setGroup]  = useState('hotel')

  const {
    data, isLoading, unsaved, hasUnsaved,
    isSaving, handleChange, handleDiscard, handleSave,
  } = useSettings(group)

  return (
    <div className="max-w-3xl space-y-6">

      {/* Indicador sin guardar */}
      {hasUnsaved && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between px-4 py-2 rounded-lg text-sm"
          style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' }}
        >
          <span>Cambios sin guardar</span>
          <button onClick={handleDiscard} className="text-xs underline" aria-label="Descartar cambios">
            Descartar
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar de categorías */}
        <nav className="w-40 flex-shrink-0 space-y-1" aria-label="Categorías">
          {GROUPS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setGroup(key)}
              aria-current={group === key ? 'page' : undefined}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: group === key ? 'var(--color-primary-light)' : 'transparent',
                color:      group === key ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: group === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Campos */}
        <div
          className="flex-1 rounded-xl p-6 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {isLoading ? (
            <SkeletonText lines={6} />
          ) : (
            <>
              {Object.entries(data ?? {}).map(([key, value]) => (
                <div key={key}>
                  <label
                    htmlFor={key}
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {LABELS[key] ?? key}
                  </label>
                  <input
                    id={key}
                    type="text"
                    value={value ?? ''}
                    disabled={!canEdit}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm border transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                    )}
                    style={{
                      background:  'var(--bg-base)',
                      color:       'var(--text-primary)',
                      borderColor: unsaved[key] ? '#F59E0B' : 'var(--border-default)',
                    }}
                  />
                </div>
              ))}

              {canEdit && hasUnsaved && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  aria-busy={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <Save size={16} aria-hidden="true" />
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
