import { useState } from 'react'
import { Package, Wrench, ShoppingCart, AlertTriangle, ClipboardList } from 'lucide-react'
import ConsumiblesTab from './tabs/ConsumiblesTab'
import ActivosTab from './tabs/ActivosTab'
import MinibarTab from './tabs/MinibarTab'
import MantenimientosTab from './tabs/MantenimientosTab'
import ReparacionesTab from './tabs/ReparacionesTab'

const TABS = [
  { key: 'consumibles',    label: 'Consumibles',    icon: Package },
  { key: 'activos',        label: 'Activos',         icon: Wrench },
  { key: 'minibar',        label: 'Minibar',         icon: ShoppingCart },
  { key: 'mantenimientos', label: 'Mantenimientos',  icon: AlertTriangle },
  { key: 'reparaciones',   label: 'Reparaciones',    icon: ClipboardList },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function InventoryPage() {
  const [tab, setTab] = useState<TabKey>('consumibles')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-input)' }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              tab === key
                ? { background: 'var(--bg-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'consumibles'    && <ConsumiblesTab />}
      {tab === 'activos'        && <ActivosTab />}
      {tab === 'minibar'        && <MinibarTab />}
      {tab === 'mantenimientos' && <MantenimientosTab />}
      {tab === 'reparaciones'   && <ReparacionesTab />}
    </div>
  )
}
