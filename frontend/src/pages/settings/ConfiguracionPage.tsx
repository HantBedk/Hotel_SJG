import type { ElementType } from 'react'
import { Boxes, Cog, Globe, SlidersHorizontal } from 'lucide-react'
import ConfiguracionForm, {
  SETTINGS_CONFIG_GROUPS,
  type SettingsConfigGroup,
} from './tabs/ConfiguracionTab'
import NationalitiesTab from './tabs/NationalitiesTab'

const SECTION_ICONS: Record<SettingsConfigGroup, ElementType> = {
  hotel: SlidersHorizontal,
  inventory: Boxes,
  system: Cog,
}

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {SETTINGS_CONFIG_GROUPS.map(({ key, label, description }) => {
        const Icon = SECTION_ICONS[key]
        return (
          <section
            key={key}
            aria-labelledby={`config-section-${key}`}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border-default)' }}
          >
            <header
              className="flex items-start gap-3 px-5 py-4"
              style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-default)' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--bg-surface)', color: 'var(--color-primary)' }}
              >
                <Icon size={18} aria-hidden="true" />
              </div>
              <div>
                <h2
                  id={`config-section-${key}`}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {label}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {description}
                </p>
              </div>
            </header>
            <div className="p-5">
              <ConfiguracionForm group={key} />
            </div>
          </section>
        )
      })}
      <section
        aria-labelledby="config-section-nationalities"
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-default)' }}
      >
        <header
          className="flex items-start gap-3 px-5 py-4"
          style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-default)' }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-surface)', color: 'var(--color-primary)' }}
          >
            <Globe size={18} aria-hidden="true" />
          </div>
          <div>
            <h2
              id="config-section-nationalities"
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Nacionalidades
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Países disponibles en formularios de personas
            </p>
          </div>
        </header>
        <div className="p-5">
          <NationalitiesTab />
        </div>
      </section>
    </div>
  )
}
