import type { ElementType } from 'react'
import { Building2, BedDouble, Users, CalendarCheck, DollarSign, AlertTriangle } from 'lucide-react'
import { formatCOP } from '@/lib/format'
import type { DashboardStats } from '@/types'

export interface KpiItem {
  label: string
  value: string | number
  sub: string
  icon: ElementType
  color: string
  colorBg: string
  circular?: boolean
  pct?: number
  onClick?: () => void
}

export function buildDashboardKpis(
  stats: DashboardStats | undefined,
  occupancyPct: number,
  onShowOccupancy: () => void,
  onNavigateIncome?: () => void,
): KpiItem[] {
  const kpis: KpiItem[] = [
    {
      label: 'Ocupación actual',
      value: `${occupancyPct}%`,
      sub: stats ? `${stats.occupied} de ${stats.total_rooms} hab.` : '—',
      icon: Building2,
      color: 'var(--color-primary)',
      colorBg: 'var(--color-primary-light)',
      circular: true,
      pct: occupancyPct,
      onClick: onShowOccupancy,
    },
    {
      label: 'Disponibles',
      value: stats?.available ?? '—',
      sub: 'Listas para check-in',
      icon: BedDouble,
      color: '#22C55E',
      colorBg: '#ECFDF5',
    },
    {
      label: 'Estadías activas',
      value: stats?.active_stays ?? '—',
      sub: 'Huéspedes en hotel',
      icon: Users,
      color: 'var(--color-primary)',
      colorBg: 'var(--color-primary-light)',
    },
    {
      label: 'Check-ins hoy',
      value: stats?.checkins_today ?? '—',
      sub: 'Entradas del día',
      icon: CalendarCheck,
      color: '#F59E0B',
      colorBg: '#FFFBEB',
    },
    {
      label: 'Diario',
      value: stats ? formatCOP(stats.today_room_revenue ?? 0) : '—',
      sub: 'Habitaciones ocupadas esta noche',
      icon: DollarSign,
      color: '#16A34A',
      colorBg: '#ECFDF5',
      onClick: onNavigateIncome,
    },
  ]

  const invAlerts = stats?.inventory_alerts
  if (invAlerts && invAlerts.total > 0) {
    const parts: string[] = []
    if (invAlerts.low_stock > 0) parts.push(`${invAlerts.low_stock} stock bajo`)
    if (invAlerts.expiring > 0) parts.push(`${invAlerts.expiring} por vencer`)
    if (invAlerts.maintenances_soon > 0) parts.push(`${invAlerts.maintenances_soon} mant.`)
    kpis.push({
      label: 'Alertas inventario',
      value: invAlerts.total,
      sub: parts.join(' · '),
      icon: AlertTriangle,
      color: '#D97706',
      colorBg: '#FFFBEB',
    })
  }

  return kpis
}

export function kpiSkeletonKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `kpi-skeleton-${i + 1}`)
}
