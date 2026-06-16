import { AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useHotelStore } from '@/store/hotelStore'

const STAFF_ROLES = ['admin', 'receptionist', 'housekeeping', 'maintenance'] as const

export default function NoHotelAssignedBanner() {
  const user = useAuthStore((s) => s.user)
  const hotels = useHotelStore((s) => s.hotels)

  if (! user) return null

  const isSuperadmin = user.roles.includes('superadmin')
  const isStaff = user.roles.some((role) => STAFF_ROLES.includes(role as typeof STAFF_ROLES[number]))

  if (isSuperadmin || ! isStaff || hotels.length > 0) {
    return null
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{
        borderColor: 'var(--warning-border, #f59e0b55)',
        background:  'var(--warning-bg, #f59e0b14)',
        color:       'var(--text-primary)',
      }}
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
      <div>
        <p className="font-medium">Sin hotel asignado</p>
        <p className="mt-1 text-[var(--text-secondary)]">
          Tu cuenta no tiene hoteles vinculados. Contacta al superadministrador para que te asigne
          al menos un hotel; mientras tanto no verás datos operativos.
        </p>
      </div>
    </div>
  )
}
