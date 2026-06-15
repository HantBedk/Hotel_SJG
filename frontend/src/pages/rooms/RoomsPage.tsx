import { useState } from 'react'
import { LogIn, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRooms } from '@/hooks/useRooms'
import { useReverb } from '@/hooks/useReverb'
import { useHotelStore } from '@/store/hotelStore'
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

const ROOM_SKELETON_KEYS = [
  'room-skeleton-1', 'room-skeleton-2', 'room-skeleton-3', 'room-skeleton-4',
  'room-skeleton-5', 'room-skeleton-6', 'room-skeleton-7', 'room-skeleton-8',
  'room-skeleton-9', 'room-skeleton-10', 'room-skeleton-11', 'room-skeleton-12',
  'room-skeleton-13', 'room-skeleton-14',
] as const

function selectionSummaryText(count: number): string {
  if (count === 1) return '1 habitación seleccionada'
  return `${count} habitaciones seleccionadas`
}

export default function RoomsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('manage_rooms') || hasPermission('check_in')

  const [filter, setFilter]         = useState<RoomStatus | 'all'>('all')
  const [editing, setEditing]       = useState<Room | null>(null)
  const [checkingIn, setCheckingIn] = useState<Room[]>([])
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([])

  const {
    rooms, isLoading,
    changeStatus, isChanging,
    syncRoomStatus,
  } = useRooms(filter === 'all' ? undefined : filter)

  const currentHotelId = useHotelStore((s) => s.currentHotelId)

  useReverb<{ id: string; status: RoomStatus }>({
    channel: currentHotelId ? `hotel.${currentHotelId}.rooms` : 'hotel.rooms',
    event:   'room.status.changed',
    onEvent: ({ id, status }) => {
      syncRoomStatus(id, status)
      // Remove from selection if no longer available
      if (status !== 'available') {
        setSelectedRooms(prev => prev.filter(r => r.id !== id))
      }
    },
    enabled: !!currentHotelId,
  })

  const handleConfirm = (status: RoomStatus, notes?: string) => {
    if (!editing) return
    changeStatus(
      { id: editing.id, status, notes },
      { onSuccess: () => setEditing(null) }
    )
  }

  const toggleSelect = (room: Room) => {
    setSelectedRooms(prev =>
      prev.some(r => r.id === room.id)
        ? prev.filter(r => r.id !== room.id)
        : [...prev, room]
    )
  }

  const clearSelection = () => setSelectedRooms([])

  const openWizard = (rooms: Room[]) => {
    setCheckingIn(rooms)
    setSelectedRooms([])
  }

  let gridContent
  if (isLoading) {
    gridContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ROOM_SKELETON_KEYS.map((key) => <SkeletonCard key={key} />)}
      </div>
    )
  } else if (rooms.length === 0) {
    gridContent = (
      <div
        className="rounded-xl p-12 text-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay habitaciones con ese estado.
        </p>
      </div>
    )
  } else {
    gridContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            canEdit={canEdit}
            onChangeStatus={setEditing}
            onCheckIn={canEdit ? (r) => openWizard([r]) : undefined}
            isSelected={selectedRooms.some((r) => r.id === room.id)}
            onSelect={canEdit && room.status === 'available' ? toggleSelect : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20">

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const isActive = filter === key
          const cfg = key === 'all' ? null : STATUS_CONFIG[key]
          return (
            <button
              key={key}
              type="button"
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
      {gridContent}

      {/* Status change modal */}
      {editing && (
        <RoomStatusModal
          room={editing}
          onConfirm={handleConfirm}
          onClose={() => setEditing(null)}
          isSaving={isChanging}
        />
      )}

      {/* Check-in wizard */}
      {checkingIn.length > 0 && (
        <CheckInWizard
          rooms={checkingIn}
          onClose={() => setCheckingIn([])}
        />
      )}

      {/* Floating multi-select action bar */}
      {selectedRooms.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
          style={{ background: 'var(--bg-surface)', border: '2px solid var(--color-primary)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {selectionSummaryText(selectedRooms.length)}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {selectedRooms.map(r => `Hab. ${r.number}`).join(', ')}
          </span>
          <button
            type="button"
            onClick={() => openWizard(selectedRooms)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <LogIn size={13} />
            Iniciar Check-in
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Cancelar selección"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
