import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonText } from '@/components/ui/Skeleton'
import type { ApiResponse } from '@/types'

interface SettingsMap {
  [key: string]: string
}

const GROUPS = [
  { key: 'hotel',  label: 'Hotel' },
  { key: 'system', label: 'Sistema' },
  { key: 'backup', label: 'Backups' },
]

const LABELS: Record<string, string> = {
  'hotel.iva_enabled':      'IVA habilitado',
  'hotel.iva_rate':         'Tasa IVA (%)',
  'hotel.check_in_time':    'Hora check-in',
  'hotel.check_out_time':   'Hora check-out',
  'hotel.currency':         'Moneda',
  'hotel.country':          'País',
  'hotel.late_checkout_fee':'Recargo checkout tardío (COP)',
  'system.date_format':     'Formato de fecha',
  'system.time_format':     'Formato de hora',
  'backup.auto_backup':     'Backup automático',
  'backup.retention_days':  'Retención de backups (días)',
}

export default function SettingsPage() {
  const { hasPermission } = useAuth()
  const canEdit    = hasPermission('manage_settings')
  const queryClient = useQueryClient()

  const [activeGroup, setActiveGroup] = useState('hotel')
  const [unsaved, setUnsaved]         = useState<Record<string, string>>({})
  const hasUnsaved = Object.keys(unsaved).length > 0

  const { data, isLoading } = useQuery({
    queryKey: ['settings', activeGroup],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SettingsMap>>(`/settings?group=${activeGroup}`)
      return res.data.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (changes: Record<string, string>) => {
      const settings = Object.entries(changes).map(([key, value]) => ({ key, value }))
      await api.put('/settings', { settings })
    },
    onSuccess: () => {
      toast.success('Configuración guardada.')
      setUnsaved({})
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => toast.error('Error al guardar la configuración.'),
  })

  const handleChange = (key: string, value: string) => {
    setUnsaved((prev) => ({ ...prev, [key]: value }))
  }

  const currentData = { ...data, ...unsaved }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Unsaved indicator */}
      {hasUnsaved && (
        <div
          className="flex items-center justify-between px-4 py-2 rounded-lg text-sm"
          style={{
            background:   '#FEF3C7',
            border:       '1px solid #F59E0B',
            color:        '#92400E',
          }}
          role="status"
          aria-live="polite"
        >
          <span>Cambios sin guardar</span>
          <button
            onClick={() => setUnsaved({})}
            className="text-xs underline"
            aria-label="Descartar cambios"
          >
            Descartar
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Group sidebar */}
        <nav
          className="w-40 flex-shrink-0 space-y-1"
          aria-label="Categorías de configuración"
        >
          {GROUPS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveGroup(key); setUnsaved({}) }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background:  activeGroup === key ? 'var(--color-primary-light)' : 'transparent',
                color:       activeGroup === key ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight:  activeGroup === key ? 600 : 400,
              }}
              aria-current={activeGroup === key ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Settings form */}
        <div
          className="flex-1 rounded-xl p-6 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {isLoading ? (
            <SkeletonText lines={6} />
          ) : (
            <>
              {Object.entries(currentData ?? {}).map(([key, value]) => (
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
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:   'var(--bg-base)',
                      color:        'var(--text-primary)',
                      borderColor:  unsaved[key] ? '#F59E0B' : 'var(--border-default)',
                    }}
                    aria-label={LABELS[key] ?? key}
                  />
                </div>
              ))}

              {canEdit && hasUnsaved && (
                <button
                  onClick={() => saveMutation.mutate(unsaved)}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
                  style={{ background: 'var(--color-primary)' }}
                  aria-busy={saveMutation.isPending}
                >
                  <Save size={16} aria-hidden="true" />
                  {saveMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
