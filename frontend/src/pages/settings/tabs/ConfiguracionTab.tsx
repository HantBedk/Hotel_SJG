import { Save, Undo2 } from 'lucide-react'
import { type ChangeEvent } from 'react'
import { useSettings } from '@/hooks/useSettings'
import type { SettingsMap } from '@/services/settings.service'
import { FormField } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { Checkbox } from '@/components/ui/Checkbox'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

export const SETTINGS_CONFIG_GROUPS = [
  { key: 'hotel', label: 'Operación del hotel', description: 'IVA, horarios, reservas y limpieza' },
  { key: 'inventory', label: 'Inventario', description: 'Alertas de vencimiento y stock bajo' },
  { key: 'system', label: 'Sistema', description: 'Formato de fecha y hora en la interfaz' },
] as const

export type SettingsConfigGroup = typeof SETTINGS_CONFIG_GROUPS[number]['key']

type SettingInputType = 'boolean' | 'text' | 'time' | 'number'

interface SettingMeta {
  readonly label: string
  readonly hint?: string
  readonly inputType: SettingInputType
  readonly subsection?: string
}

const SUBSECTION_LABELS: Record<string, string> = {
  fiscal: 'Fiscal y moneda',
  schedule: 'Horarios operativos',
  reservations: 'Reservas',
  cleaning: 'Limpieza y alertas',
  general: 'General',
}

const SETTING_META: Record<string, SettingMeta> = {
  'hotel.iva_enabled': {
    label: 'IVA habilitado',
    hint: 'Aplica impuesto en tarifas y reportes de ingresos',
    inputType: 'boolean',
    subsection: 'fiscal',
  },
  'hotel.iva_rate': {
    label: 'Tasa IVA (%)',
    hint: 'Porcentaje entero, ej. 19',
    inputType: 'number',
    subsection: 'fiscal',
  },
  'hotel.currency': {
    label: 'Moneda',
    hint: 'Código ISO, ej. COP',
    inputType: 'text',
    subsection: 'fiscal',
  },
  'hotel.country': {
    label: 'País',
    inputType: 'text',
    subsection: 'fiscal',
  },
  'hotel.check_in_time': {
    label: 'Hora check-in',
    inputType: 'time',
    subsection: 'schedule',
  },
  'hotel.check_out_time': {
    label: 'Hora check-out',
    inputType: 'time',
    subsection: 'schedule',
  },
  'hotel.late_checkout_fee': {
    label: 'Recargo checkout tardío (COP)',
    inputType: 'number',
    subsection: 'schedule',
  },
  'hotel.reservations_enabled': {
    label: 'Reservas habilitadas',
    inputType: 'boolean',
    subsection: 'reservations',
  },
  'hotel.auto_assign_reservations': {
    label: 'Asignación automática de habitación',
    hint: 'Asigna habitación al confirmar reserva cuando hay disponibilidad',
    inputType: 'boolean',
    subsection: 'reservations',
  },
  'hotel.reservation_alert_hours': {
    label: 'Alertar reservas (horas antes)',
    inputType: 'number',
    subsection: 'reservations',
  },
  'hotel.cleaning_alerts': {
    label: 'Alertas de limpieza',
    inputType: 'boolean',
    subsection: 'cleaning',
  },
  'hotel.cleaning_hour': {
    label: 'Hora de limpieza programada',
    inputType: 'time',
    subsection: 'cleaning',
  },
  'hotel.notify_cleaning_done': {
    label: 'Notificar habitación lista',
    inputType: 'boolean',
    subsection: 'cleaning',
  },
  'hotel.admin_alert_hours': {
    label: 'Horarios resumen alertas admin',
    hint: 'Formato HH:mm separados por coma, ej. 06:00,20:00',
    inputType: 'text',
    subsection: 'cleaning',
  },
  'inventory.expiry_alert_days': {
    label: 'Alertar vencimiento (días)',
    hint: 'Días antes del vencimiento para mostrar alerta',
    inputType: 'number',
  },
  'inventory.low_stock_threshold': {
    label: 'Umbral de stock bajo',
    hint: 'Cantidad mínima antes de marcar producto en alerta',
    inputType: 'number',
  },
  'system.date_format': {
    label: 'Formato de fecha',
    hint: 'Ej. DD/MM/YYYY',
    inputType: 'text',
  },
  'system.time_format': {
    label: 'Formato de hora',
    hint: 'Ej. HH:mm',
    inputType: 'text',
  },
}

const HOTEL_SUBSECTION_ORDER = ['fiscal', 'schedule', 'reservations', 'cleaning'] as const

function settingMeta(key: string): SettingMeta {
  return SETTING_META[key] ?? { label: key, inputType: 'text' }
}

function isBooleanValue(value: string | undefined): boolean {
  return value === 'true' || value === 'false'
}

function resolveInputType(key: string, value: string | undefined): SettingInputType {
  const meta = settingMeta(key)
  if (meta.inputType === 'boolean' || isBooleanValue(value)) return 'boolean'
  return meta.inputType
}

function toTimeInputValue(value: string): string {
  if (!value) return ''
  const parts = value.split(':')
  if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  return value
}

function inputBorderStyle(isUnsaved: boolean): { borderColor: string } {
  if (isUnsaved) return { borderColor: '#F59E0B' }
  return { borderColor: 'var(--border-default)' }
}

function groupKeysBySubsection(keys: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>()

  for (const key of keys) {
    const subsection = settingMeta(key).subsection ?? 'general'
    const current = map.get(subsection) ?? []
    current.push(key)
    map.set(subsection, current)
  }

  return map
}

function subsectionSortOrder(subsection: string, group: SettingsConfigGroup): number {
  if (group === 'hotel') {
    const index = HOTEL_SUBSECTION_ORDER.indexOf(subsection as typeof HOTEL_SUBSECTION_ORDER[number])
    if (index >= 0) return index
  }
  return 99
}

interface SettingFieldProps {
  readonly settingKey: string
  readonly value: string
  readonly isUnsaved: boolean
  readonly onChange: (key: string, value: string) => void
}

function SettingField({ settingKey, value, isUnsaved, onChange }: SettingFieldProps) {
  const meta = settingMeta(settingKey)
  const inputType = resolveInputType(settingKey, value)
  const fieldId = `setting-${settingKey.replaceAll('.', '-')}`

  if (inputType === 'boolean') {
    return (
      <div
        className={cn(
          'rounded-xl px-4 py-3 border transition-colors',
          isUnsaved && 'ring-1 ring-amber-400/40',
        )}
        style={{ background: 'var(--bg-muted)', borderColor: isUnsaved ? '#F59E0B' : 'var(--border-default)' }}
      >
        <Checkbox
          id={fieldId}
          checked={value === 'true'}
          onChange={(checked) => onChange(settingKey, checked ? 'true' : 'false')}
          label={meta.label}
        />
        {meta.hint && (
          <p className="text-[11px] mt-1.5 ml-6" style={{ color: 'var(--text-muted)' }}>{meta.hint}</p>
        )}
      </div>
    )
  }

  const inputProps = {
    id: fieldId,
    value: value ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(settingKey, e.target.value),
    className: personInputClass,
    style: { ...personInputStyle, ...inputBorderStyle(isUnsaved) },
  }

  return (
    <FormField id={fieldId} label={meta.label} hint={meta.hint}>
      {inputType === 'time' && (
        <input type="time" {...inputProps} value={toTimeInputValue(value)} />
      )}
      {inputType === 'number' && (
        <input type="number" min={0} {...inputProps} />
      )}
      {inputType === 'text' && (
        <input type="text" {...inputProps} />
      )}
    </FormField>
  )
}

interface UnsavedBannerProps {
  readonly onDiscard: () => void
  readonly onSave: () => void
  readonly isSaving: boolean
}

function UnsavedBanner({ onDiscard, onSave, isSaving }: UnsavedBannerProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl"
      style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}
    >
      <p className="text-sm font-medium" style={{ color: '#92400E' }}>
        Tienes cambios sin guardar en esta sección
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border disabled:opacity-60"
          style={{ borderColor: '#F59E0B', color: '#92400E', background: 'transparent' }}
        >
          <Undo2 size={13} aria-hidden="true" />
          Descartar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          <Save size={13} aria-hidden="true" />
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

interface SettingsFormProps {
  readonly group: SettingsConfigGroup
  readonly data: SettingsMap
  readonly unsaved: SettingsMap
  readonly onChange: (key: string, value: string) => void
}

function SettingsForm({ group, data, unsaved, onChange }: SettingsFormProps) {
  const keys = Object.keys(data)
  const grouped = groupKeysBySubsection(keys)
  const subsections = [...grouped.keys()].sort(
    (a, b) => subsectionSortOrder(a, group) - subsectionSortOrder(b, group),
  )

  return (
    <div className="space-y-6">
      {subsections.map((subsection) => {
        const subsectionKeys = grouped.get(subsection) ?? []
        const showSubsectionTitle = group === 'hotel' || (subsection !== 'general' && subsections.length > 1)

        return (
          <div key={subsection} className="space-y-4">
            {showSubsectionTitle && (
              <h3
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                {SUBSECTION_LABELS[subsection] ?? subsection}
              </h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subsectionKeys.map((key) => {
                const inputType = resolveInputType(key, data[key])
                const spanFull = inputType === 'boolean'

                return (
                  <div key={key} className={spanFull ? 'sm:col-span-2' : ''}>
                    <SettingField
                      settingKey={key}
                      value={data[key] ?? ''}
                      isUnsaved={key in unsaved}
                      onChange={onChange}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
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

  if (isLoading) {
    return <SkeletonText lines={6} />
  }

  return (
    <div className="space-y-5">
      {hasUnsaved && (
        <UnsavedBanner
          onDiscard={handleDiscard}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      <SettingsForm
        group={group}
        data={data ?? {}}
        unsaved={unsaved}
        onChange={handleChange}
      />
    </div>
  )
}
