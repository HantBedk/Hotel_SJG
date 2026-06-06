import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, CreditCard } from 'lucide-react'
import AuditoriaTab     from './tabs/AuditoriaTab'
import PagosHistoricoTab from './tabs/PagosHistoricoTab'

const TABS = [
  { key: 'auditoria', label: 'Auditoría',        icon: ClipboardList },
  { key: 'pagos',     label: 'Pagos históricos',  icon: CreditCard },
] as const

type Tab = typeof TABS[number]['key']
const VALID_TABS = new Set<string>(TABS.map((t) => t.key))

export default function ActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get('tab') ?? ''
  const [active, setActive] = useState<Tab>(
    VALID_TABS.has(initial) ? (initial as Tab) : 'auditoria',
  )

  useEffect(() => {
    const next = searchParams.get('tab') ?? ''
    if (VALID_TABS.has(next) && next !== active) setActive(next as Tab)
  }, [searchParams, active])

  const changeTab = (key: Tab) => {
    setActive(key)
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev)
      sp.set('tab', key)
      return sp
    }, { replace: true })
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-lg w-fit"
        style={{ background: 'var(--bg-muted)' }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => changeTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors"
            style={{
              background: active === key ? 'var(--bg-surface)' : 'transparent',
              color:      active === key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: active === key ? 600 : 400,
              boxShadow:  active === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === 'auditoria' && <AuditoriaTab />}
      {active === 'pagos'     && <PagosHistoricoTab />}
    </div>
  )
}
