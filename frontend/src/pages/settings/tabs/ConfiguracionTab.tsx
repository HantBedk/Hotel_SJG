import { type CSSProperties } from 'react'
import { Save } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import type { SettingsMap } from '@/services/settings.service'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

export const SETTINGS_CONFIG_GROUPS = [
  { key: 'hotel', label: 'Hotel' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'system', label: 'Sistema' },
] as const

export type SettingsConfigGroup = typeof SETTINGS_CONFIG_GROUPS[number]['key']

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

function settingLabel(key: string): string {
  return LABELS[key] ?? key
}

function settingBorderColor(isUnsaved: boolean): string {
  if (isUnsaved) return '#F59E0B'
  return 'var(--border-default)'
}

function segmentButtonStyle(selected: boolean): CSSProperties {
  if (selected) {
    return { background: 'var(--color-primary)', color: '#fff' }
  }
  return { background: 'transparent', color: 'var(--text-secondary)' }
}

function saveButtonLabel(isSaving: boolean): string {
  if (isSaving) return 'Guardando…'
  return 'Guardar cambios'
}

interface BooleanSettingFieldProps {
  readonly settingKey: string
  readonly value: string
  readonly isUnsaved: boolean
  readonly onChange: (key: string, value: string) => void
}

function BooleanSettingField({ settingKey, value, isUnsaved, onChange }: BooleanSettingFieldProps) {
  const activated = value === 'true'
  const deactivated = value === 'false'

  return (
    <fieldset
      id={settingKey}
      className="border-0 p-0 m-0 min-w-0"
    >
      <legend className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {settingLabel(settingKey)}
      </legend>
      <div
        className="inline-flex p-0.5 rounded-lg text-xs font-medium"
        style={{
          background: 'var(--bg-base)',
          border: `1px solid ${settingBorderColor(isUnsaved)}`,
        }}
      >
        <button
          type="button"
          onClick={() => onChange(settingKey, 'true')}
          aria-pressed={activated}
          className="px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={segmentButtonStyle(activated)}
        >
          Activado
        </button>
        <button
          type="button"
          onClick={() => onChange(settingKey, 'false')}
          aria-pressed={deactivated}
          className="px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={segmentButtonStyle(deactivated)}
        >
          Desactivado
        </button>
      </div>
    </fieldset>
  )
}

interface TextSettingFieldProps {
  readonly settingKey: string
  readonly value: string
  readonly isUnsaved: boolean
  readonly onChange: (key: string, value: string) => void
}

function TextSettingField({ settingKey, value, isUnsaved, onChange }: TextSettingFieldProps) {
  return (
    <>
      <label htmlFor={settingKey} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {settingLabel(settingKey)}
      </label>
      <input
        id={settingKey}
        type="text"
        value={value ?? ''}
        onChange={e => onChange(settingKey, e.target.value)}
        className={cn('w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500')}
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          borderColor: settingBorderColor(isUnsaved),
        }}
      />
    </>
  )
}

function isBooleanSetting(value: string | undefined): boolean {
  return value === 'true' || value === 'false'
}

interface SettingFieldProps {
  readonly settingKey: string
  readonly value: string
  readonly isUnsaved: boolean
  readonly onChange: (key: string, value: string) => void
}

function SettingField({ settingKey, value, isUnsaved, onChange }: SettingFieldProps) {
  if (isBooleanSetting(value)) {
    return (
      <BooleanSettingField
        settingKey={settingKey}
        value={value}
        isUnsaved={isUnsaved}
        onChange={onChange}
      />
    )
  }

  return (
    <TextSettingField
      settingKey={settingKey}
      value={value}
      isUnsaved={isUnsaved}
      onChange={onChange}
    />
  )
}

interface SettingsFormProps {
  readonly data: SettingsMap
  readonly unsaved: SettingsMap
  readonly hasUnsaved: boolean
  readonly isSaving: boolean
  readonly onChange: (key: string, value: string) => void
  readonly onSave: () => void
}

function SettingsForm({ data, unsaved, hasUnsaved, isSaving, onChange, onSave }: SettingsFormProps) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <SettingField
            settingKey={key}
            value={value}
            isUnsaved={key in unsaved}
            onChange={onChange}
          />
        </div>
      ))}

      {hasUnsaved && (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Save size={14} />
          {saveButtonLabel(isSaving)}
        </button>
      )}
    </>
  )
}

interface ConfiguracionFormProps {
  readonly group: SettingsConfigGroup
}

export default function ConfiguracionForm({ group }: ConfiguracionFormProps) {
  const {
    data, isLoading, unsaved, hasUnsaved,
    isSaving, handleChange, handleDiscard, handleSave,
  } = useSettings(group)

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      {hasUnsaved && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
          style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' }}
        >
          <span>Cambios sin guardar</span>
          <button type="button" onClick={handleDiscard} className="underline">Descartar</button>
        </div>
      )}

      {isLoading ? (
        <SkeletonText lines={5} />
      ) : (
        <SettingsForm
          data={data ?? {}}
          unsaved={unsaved}
          hasUnsaved={hasUnsaved}
          isSaving={isSaving}
          onChange={handleChange}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
