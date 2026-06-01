import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRooms } from '@/hooks/useRooms'
import { useReverb } from '@/hooks/useReverb'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { RoomCard } from './components/RoomCard'
import { RoomStatusModal } from './components/RoomStatusModal'
import { STATUS_CONFIG } from './components/RoomStatusBadge'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import type { Room, RoomStatus } from '@/types'
import { cn } from '@/lib/cn'

const FILTERS: { key: RoomStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'Todas' },
  { key: 'available',   label: 'Disponibles' },
  { key: 'occupied',    label: 'Ocupadas' },
  { key: 'reserved',    label: 'Reservadas' },
  { key: 'cleaning',    label: 'Limpieza' },
  { key: 'maintenance', label: 'Mantenimiento' },
]

export default function RoomsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('manage_rooms') || hasPermission('check_in')

  const [filter, setFilter]     = useState<RoomStatus | 'all'>('all')
  const [editing, setEditing]   = useState<Room | null>(null)
  const [checkingIn, setCheckingIn] = useState<Room[]>([])

  const {
    rooms, isLoading,
    changeStatus, isChanging,
    syncRoomStatus,
  } = useRooms(filter === 'all' ? undefined : filter)

  // Sincroniza cambios de estado en tiempo real desde otros usuarios
  useReverb<{ id: string; status: RoomStatus }>({
    channel: 'hotel.rooms',
    event:   'room.status.changed',
    onEvent: ({ id, status }) => syncRoomStatus(id, status),
    enabled: true,
  })

  const handleConfirm = (status: RoomStatus, notes?: string) => {
    if (!editing) return
    changeStatus(
      { id: editing.id, status, notes },
      { onSuccess: () => setEditing(null) }
    )
  }

  return (
    <div className="space-y-5">

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const isActive = filter === key
          const cfg = key !== 'all' ? STATUS_CONFIG[key] : null
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                isActive ? 'border-transparent' : 'hover:opacity-80'
              )}
              style={{
                background:  isActive ? (cfg?.bg ?? 'var(--color-primary-light)') : 'transparent',
                color:       isActive ? (cfg?.color ?? 'var(--color-primary)') : 'var(--text-secondary)',
                borderColor: isActive ? 'transparent' : 'var(--border-default)',
                fontWeight:  isActive ? 600 : 400,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 14 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : rooms.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay habitaciones con ese estado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              canEdit={canEdit}
              onChangeStatus={setEditing}
              onCheckIn={canEdit ? (r) => setCheckingIn([r]) : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal cambio de estado */}
      {editing && (
        <RoomStatusModal
          room={editing}
          onConfirm={handleConfirm}
          onClose={() => setEditing(null)}
          isSaving={isChanging}
        />
      )}

      {/* Wizard de Check-in */}
      {checkingIn.length > 0 && (
        <CheckInWizard
          rooms={checkingIn}
          onClose={() => setCheckingIn([])}
        />
      )}
    </div>
  )
}
