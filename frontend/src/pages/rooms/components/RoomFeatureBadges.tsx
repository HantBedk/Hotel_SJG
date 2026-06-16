import type { ElementType } from 'react'
import {
  Bath,
  Lock,
  Phone,
  Sparkles,
  Sun,
  Tv,
  Wifi,
  Wind,
  Wine,
} from 'lucide-react'
import type { RoomFeature } from '@/types/room'

function featureIcon(name: string): ElementType {
  const normalized = name.toLowerCase()

  if (normalized.includes('aire') || normalized.includes('acondicion')) return Wind
  if (normalized.includes('tv')) return Tv
  if (normalized.includes('teléfono') || normalized.includes('telefono')) return Phone
  if (normalized.includes('internet') || normalized.includes('wifi')) return Wifi
  if (normalized.includes('minibar')) return Wine
  if (normalized.includes('baño') || normalized.includes('bano')) return Bath
  if (normalized.includes('balcón') || normalized.includes('balcon')) return Sun
  if (normalized.includes('caja') || normalized.includes('fuerte')) return Lock

  return Sparkles
}

export interface RoomFeatureBadgesProps {
  readonly features: RoomFeature[] | undefined
  readonly max?: number
  readonly size?: 'sm' | 'md'
  readonly showIcons?: boolean
  readonly emptyLabel?: string
}

export function RoomFeatureBadges({
  features,
  max = 4,
  size = 'sm',
  showIcons = false,
  emptyLabel = 'Sin características',
}: RoomFeatureBadgesProps) {
  if (!features?.length) {
    return (
      <span
        className={size === 'sm' ? 'text-[10px]' : 'text-xs'}
        style={{ color: 'var(--text-muted)' }}
      >
        {emptyLabel}
      </span>
    )
  }

  const visible = features.slice(0, max)
  const extra = features.length - visible.length
  const textClass = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const iconSize = size === 'sm' ? 10 : 12
  const padClass = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((feature) => {
        const Icon = showIcons ? featureIcon(feature.name) : null

        return (
          <span
            key={feature.id}
            title={feature.name}
            className={`inline-flex items-center gap-1 rounded font-medium ${padClass} ${textClass}`}
            style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
          >
            {Icon && <Icon size={iconSize} aria-hidden="true" className="shrink-0 opacity-80" />}
            <span className="truncate max-w-[8rem]">{feature.name}</span>
          </span>
        )
      })}
      {extra > 0 && (
        <span
          className={`inline-flex items-center rounded font-medium ${padClass} ${textClass}`}
          style={{ color: 'var(--text-muted)' }}
          title={features.slice(max).map((f) => f.name).join(', ')}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

export interface RoomFeatureListProps {
  readonly features: RoomFeature[] | undefined
}

/** Lista completa con iconos para detalle de tarjeta */
export function RoomFeatureList({ features }: RoomFeatureListProps) {
  if (!features?.length) {
    return (
      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
        Sin características registradas
      </p>
    )
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {features.map((feature) => {
        const Icon = featureIcon(feature.name)

        return (
          <li key={feature.id}>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium max-w-full"
              style={{
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              <Icon size={12} aria-hidden="true" className="shrink-0" />
              <span className="break-words">{feature.name}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
