import { BedDouble, Users, CalendarCheck, AlertCircle } from 'lucide-react'

const STAT_CARDS = [
  {
    label:       'Habitaciones disponibles',
    value:       '—',
    icon:        BedDouble,
    color:       'var(--status-available)',
    colorBg:     '#ECFDF5',
  },
  {
    label:       'Estadías activas',
    value:       '—',
    icon:        Users,
    color:       'var(--color-primary)',
    colorBg:     'var(--color-primary-light)',
  },
  {
    label:       'Check-ins hoy',
    value:       '—',
    icon:        CalendarCheck,
    color:       'var(--status-reserved)',
    colorBg:     '#FFFBEB',
  },
  {
    label:       'Por hacer limpieza',
    value:       '—',
    icon:        AlertCircle,
    color:       'var(--status-cleaning)',
    colorBg:     '#F5F3FF',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, colorBg }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-start gap-4"
            style={{
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border-default)',
              boxShadow:    'var(--shadow-sm)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: colorBg }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div
        className="rounded-xl p-8 text-center"
        style={{
          background: 'var(--bg-surface)',
          border:     '1px solid var(--border-default)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          El dashboard completo se construye en Fase 1.
        </p>
      </div>
    </div>
  )
}
