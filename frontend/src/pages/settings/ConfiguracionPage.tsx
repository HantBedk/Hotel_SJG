import { useCallback, useState, type ElementType, type ReactNode } from 'react'
import { Boxes, Cog, Globe, SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import ConfiguracionForm, { SETTINGS_CONFIG_GROUPS, type SettingsConfigGroup } from './tabs/ConfiguracionTab'
import NationalitiesTab from './tabs/NationalitiesTab'
import RoomFeaturesTab from './tabs/RoomFeaturesTab'

type ConfigSectionId = SettingsConfigGroup | 'nationalities' | 'room-features'

interface ConfigSectionDef {
  readonly id: ConfigSectionId
  readonly label: string
  readonly description: string
  readonly icon: ElementType
}

const GROUP_ICONS: Record<SettingsConfigGroup, ElementType> = {
  hotel: SlidersHorizontal,
  inventory: Boxes,
  system: Cog,
}

const CONFIG_SECTIONS: readonly ConfigSectionDef[] = [
  ...SETTINGS_CONFIG_GROUPS.map(({ key, label, description }) => ({
    id: key as ConfigSectionId,
    label,
    description,
    icon: GROUP_ICONS[key],
  })),
  {
    id: 'nationalities',
    label: 'Nacionalidades',
    description: 'Países en formularios de personas',
    icon: Globe,
  },
  {
    id: 'room-features',
    label: 'Características',
    description: 'Equipamiento por habitación',
    icon: Sparkles,
  },
]

function sectionDomId(id: ConfigSectionId): string {
  return `config-section-${id}`
}

interface ConfigSectionShellProps {
  readonly section: ConfigSectionDef
  readonly children: ReactNode
  readonly badge?: string
}

function ConfigSectionShell({ section, children, badge }: ConfigSectionShellProps) {
  const Icon = section.icon

  return (
    <section
      id={sectionDomId(section.id)}
      aria-labelledby={`${sectionDomId(section.id)}-title`}
      className="rounded-xl shadow-sm scroll-mt-24 overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <header
        className="flex items-start justify-between gap-3 px-4 py-4 border-b"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <Icon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id={`${sectionDomId(section.id)}-title`}
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {section.label}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {section.description}
            </p>
          </div>
        </div>
        {badge && (
          <span
            className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          >
            {badge}
          </span>
        )}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  )
}

function renderSectionContent(id: ConfigSectionId): ReactNode {
  if (id === 'nationalities') return <NationalitiesTab />
  if (id === 'room-features') return <RoomFeaturesTab />
  return <ConfiguracionForm group={id} />
}

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState<ConfigSectionId>('hotel')

  const scrollToSection = useCallback((id: ConfigSectionId) => {
    setActiveSection(id)
    document.getElementById(sectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="space-y-5 max-w-4xl pb-8">
      <header>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Parámetros generales
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          Ajustes operativos del hotel activo, catálogos compartidos y preferencias de la interfaz.
          Los cambios se aplican por establecimiento según el contexto del tenant.
        </p>
      </header>

      <nav
        aria-label="Secciones de configuración"
        className="sticky top-0 z-10 -mx-1 px-1 py-2"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CONFIG_SECTIONS.map((section) => {
            const active = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
                  active ? 'border-transparent shadow-sm' : 'hover:opacity-90',
                )}
                style={{
                  background: active ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  borderColor: active ? 'transparent' : 'var(--border-default)',
                }}
              >
                {section.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="space-y-5">
        {CONFIG_SECTIONS.map((section) => (
          <ConfigSectionShell key={section.id} section={section}>
            {renderSectionContent(section.id)}
          </ConfigSectionShell>
        ))}
      </div>
    </div>
  )
}
