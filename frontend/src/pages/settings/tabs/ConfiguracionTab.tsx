import { useState } from 'react'
import { Save } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

const GROUPS = [
  { key: 'hotel',     label: 'Hotel' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'system',    label: 'Sistema' },
]

const LABELS: Record<string, string> = {
  'hotel.iva_enabled':              'IVA habilitado',
  'hotel.iva_rate':                 'Tasa IVA (%)',
  'hotel.check_in_time':            'Hora check-in',
  'hotel.check_out_time':           'Hora check-out',
  'hotel.currency':                 'Moneda',
  'hotel.country':                  'País',
  'hotel.late_checkout_fee':        'Recargo checkout tardío (COP)',
  'hotel.reservations_enabled':     'Reservas habilitadas',
  'hotel.auto_assign_reservations': 'Asignación automática de reservas',
  'hotel.reservation_alert_hours':  'Alertar reservas con anticipación (horas)',
  'hotel.cleaning_alerts':          'Alertas de limpieza',
  'hotel.cleaning_hour':            'Hora de limpieza',
  'hotel.notify_cleaning_done':     'Notificar habitación lista',
  'system.date_format':             'Formato de fecha',
  'system.time_format':             'Formato de hora',
  'inventory.expiry_alert_days':    'Alertar productos próximos a vencer (días)',
  'inventory.low_stock_threshold':  'Umbral de stock bajo',
}

export default function ConfiguracionTab() {
  const [group, setGroup] = useState('hotel')

  const {
    data, isLoading, unsaved, hasUnsaved,
    isSaving, handleChange, handleDiscard, handleSave,
  } = useSettings(group)

  return (
    <div className="flex gap-4">
      {/* Sub-tabs de grupo */}
      <nav className="w-32 flex-shrink-0 space-y-1">
        {GROUPS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setGroup(key)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: group === key ? 'var(--color-primary-light)' : 'transparent',
              color:      group === key ? 'var(--color-primary)'       : 'var(--text-secondary)',
              fontWeight: group === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Campos */}
      <div
        className="flex-1 rounded-xl p-5 space-y-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {hasUnsaved && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
            style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' }}
          >
            <span>Cambios sin guardar</span>
            <button onClick={handleDiscard} className="underline">Descartar</button>
          </div>
        )}

        {isLoading ? (
          <SkeletonText lines={5} />
        ) : (
          <>
            {Object.entries(data ?? {}).map(([key, value]) => {
              const isBool = value === 'true' || value === 'false'
              const boolOn = value === 'true'

              return (
                <div key={key}>
                  <label htmlFor={key} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {LABELS[key] ?? key}
                  </label>

                  {isBool ? (
                    <div
                      id={key}
                      role="group"
                      className="inline-flex p-0.5 rounded-lg text-xs font-medium"
                      style={{
                        background:  'var(--bg-base)',
                        border:      `1px solid ${unsaved[key] ? '#F59E0B' : 'var(--border-default)'}`,
                      }}
                    >
                      {/* Segmented control: el botón seleccionado siempre usa el
                          mismo tratamiento (primario sólido + texto blanco) sin
                          importar si es "Activado" o "Desactivado", para que la
                          señal visual de "yo soy el seleccionado" sea idéntica y
                          se vea bien tanto en claro como en oscuro. */}
                      <button
                        type="button"
                        onClick={() => handleChange(key, 'true')}
                        aria-pressed={boolOn}
                        className="px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          background: boolOn ? 'var(--color-primary)' : 'transparent',
                          color:      boolOn ? '#fff'                 : 'var(--text-secondary)',
                        }}
                      >
                        Activado
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange(key, 'false')}
                        aria-pressed={!boolOn}
                        className="px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          background: !boolOn ? 'var(--color-primary)' : 'transparent',
                          color:      !boolOn ? '#fff'                 : 'var(--text-secondary)',
                        }}
                      >
                        Desactivado
                      </button>
                    </div>
                  ) : (
                    <input
                      id={key}
                      type="text"
                      value={value ?? ''}
                      onChange={e => handleChange(key, e.target.value)}
                      className={cn('w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500')}
                      style={{
                        background:  'var(--bg-base)',
                        color:       'var(--text-primary)',
                        borderColor: unsaved[key] ? '#F59E0B' : 'var(--border-default)',
                      }}
                    />
                  )}
                </div>
              )
            })}

            {hasUnsaved && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                <Save size={14} />
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
