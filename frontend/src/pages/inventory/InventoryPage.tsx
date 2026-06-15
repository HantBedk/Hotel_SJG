import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Wrench, ShoppingCart, AlertTriangle, ClipboardList, History } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useReverb } from '@/hooks/useReverb'
import { useHotelStore } from '@/store/hotelStore'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import { useAuth } from '@/hooks/useAuth'
import ConsumiblesTab from './tabs/ConsumiblesTab'
import ActivosTab from './tabs/ActivosTab'
import MinibarTab from './tabs/MinibarTab'
import MantenimientosTab from './tabs/MantenimientosTab'
import ReparacionesTab from './tabs/ReparacionesTab'
import HistorialTab from './tabs/HistorialTab'

const BASE_TABS = [
  { key: 'consumibles',    label: 'Consumibles',    icon: Package },
  { key: 'activos',        label: 'Activos',         icon: Wrench },
  { key: 'minibar',        label: 'Minibar',         icon: ShoppingCart },
  { key: 'mantenimientos', label: 'Mantenimientos',  icon: AlertTriangle },
  { key: 'reparaciones',   label: 'Reparaciones',    icon: ClipboardList },
] as const

const ADMIN_TABS = [
  ...BASE_TABS,
  { key: 'historial', label: 'Historial', icon: History },
] as const

type TabKey = (typeof ADMIN_TABS)[number]['key']
const ALL_VALID_TABS = new Set<string>(ADMIN_TABS.map(t => t.key))

const INVENTORY_ALERT_TYPES = new Set(['low_stock', 'expiring_product', 'maintenance_due'])

interface NotificationEvent {
  id: string
  type: string
  title: string
  message: string
}

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin') || hasRole('superadmin')
  const TABS = isAdmin ? ADMIN_TABS : BASE_TABS

  const initialTab = (searchParams.get('tab') ?? '').toLowerCase()
  const [tab, setTab] = useState<TabKey>(
    ALL_VALID_TABS.has(initialTab) ? (initialTab as TabKey) : 'consumibles',
  )
  const queryClient = useQueryClient()
  const currentHotelId = useHotelStore((s) => s.currentHotelId)

  // Reaccionar a cambios de ?tab (back/forward del navegador)
  useEffect(() => {
    const next = (searchParams.get('tab') ?? '').toLowerCase()
    if (ALL_VALID_TABS.has(next) && next !== tab) setTab(next as TabKey)
  }, [searchParams, tab])

  const changeTab = (key: TabKey) => {
    setTab(key)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      return next
    }, { replace: true })
  }

  useReverb<NotificationEvent>({
    channel: currentHotelId ? `hotel.${currentHotelId}.notifications` : 'hotel.notifications',
    event:   'notification.created',
    onEvent: (data) => {
      if (!INVENTORY_ALERT_TYPES.has(data.type)) return
      toast(data.title, { icon: '⚠️', duration: 6000 })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('inventory-items') })
      queryClient.invalidateQueries({ queryKey: hotelQueryKey('maintenances') })
    },
    enabled: !!currentHotelId,
  })

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
            onClick={() => changeTab(key)}
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
      {tab === 'historial'      && isAdmin && <HistorialTab />}
    </div>
  )
}
