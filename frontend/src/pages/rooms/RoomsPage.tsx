import { useMemo, useState } from 'react'
import { BedDouble, Building2, Layers, LogIn, Search, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRooms } from '@/hooks/useRooms'
import { useReverb } from '@/hooks/useReverb'
import { useHotelStore } from '@/store/hotelStore'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { RoomCard } from './components/RoomCard'
import { RoomStatusModal } from './components/RoomStatusModal'
import { STATUS_CONFIG } from './components/RoomStatusBadge'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import KpiCard from '@/pages/dashboard/components/KpiCard'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import type { Room, RoomStatus } from '@/types'
import { cn } from '@/lib/cn'

const FILTERS: { key: RoomStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'available', label: 'Disponibles' },
  { key: 'occupied', label: 'Ocupadas' },
  { key: 'reserved', label: 'Reservadas' },
  { key: 'cleaning', label: 'Limpieza' },
  { key: 'maintenance', label: 'Mantenimiento' },
]

const ROOM_SKELETON_KEYS = [
  'room-skeleton-1', 'room-skeleton-2', 'room-skeleton-3', 'room-skeleton-4',
  'room-skeleton-5', 'room-skeleton-6', 'room-skeleton-7', 'room-skeleton-8',
  'room-skeleton-9', 'room-skeleton-10', 'room-skeleton-11', 'room-skeleton-12',
] as const

function selectionSummaryText(count: number): string {
  if (count === 1) return '1 habitación seleccionada'
  return `${count} habitaciones seleccionadas`
}

function computeRoomStats(rooms: Room[]) {
  let available = 0
  let occupied = 0
  let other = 0
  for (const room of rooms) {
    if (room.status === 'available') available += 1
    else if (room.status === 'occupied') occupied += 1
    else other += 1
  }
  return { total: rooms.length, available, occupied, other }
}

function floorSearchText(floor: number | null | undefined): string {
  if (floor == null) return ''
  return String(floor)
}

function filterRooms(rooms: Room[], statusFilter: RoomStatus | 'all', search: string): Room[] {
  const term = search.trim().toLowerCase()

  return rooms.filter((room) => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false
    if (!term) return true

    const featureNames = room.features?.map((f) => f.name.toLowerCase()).join(' ') ?? ''
    const haystack = [
      room.number,
      room.room_type?.name ?? '',
      floorSearchText(room.floor),
      room.house?.name ?? '',
      room.notes ?? '',
      featureNames,
    ].join(' ').toLowerCase()

    return haystack.includes(term)
  })
}

export default function RoomsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('manage_rooms') || hasPermission('check_in')

  const [filter, setFilter] = useState<RoomStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Room | null>(null)
  const [checkingIn, setCheckingIn] = useState<Room[]>([])
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([])

  const {
    rooms: allRooms,
    isLoading,
    changeStatus,
    isChanging,
    syncRoomStatus,
  } = useRooms()

  const stats = useMemo(() => computeRoomStats(allRooms), [allRooms])
  const rooms = useMemo(
    () => filterRooms(allRooms, filter, search),
    [allRooms, filter, search],
  )

  const currentHotelId = useHotelStore((s) => s.currentHotelId)

  useReverb<{ id: string; status: RoomStatus }>({
    channel: currentHotelId ? `hotel.${currentHotelId}.rooms` : 'hotel.rooms',
    event: 'room.status.changed',
    onEvent: ({ id, status }) => {
      syncRoomStatus(id, status)
      if (status !== 'available') {
        setSelectedRooms((prev) => prev.filter((r) => r.id !== id))
      }
    },
    enabled: !!currentHotelId,
  })

  const handleConfirm = (status: RoomStatus, notes?: string) => {
    if (!editing) return
    changeStatus(
      { id: editing.id, status, notes },
      { onSuccess: () => setEditing(null) },
    )
  }

  const toggleSelect = (room: Room) => {
    setSelectedRooms((prev) =>
      prev.some((r) => r.id === room.id)
        ? prev.filter((r) => r.id !== room.id)
        : [...prev, room],
    )
  }

  const clearSelection = () => setSelectedRooms([])

  const openWizard = (wizardRooms: Room[]) => {
    setCheckingIn(wizardRooms)
    setSelectedRooms([])
  }

  let gridContent
  if (isLoading) {
    gridContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {ROOM_SKELETON_KEYS.map((key) => <SkeletonCard key={key} />)}
      </div>
    )
  } else if (allRooms.length === 0) {
    gridContent = (
      <div
        className="rounded-xl py-14 px-6 text-center"
        style={{ background: 'var(--bg-muted)', border: '1px dashed var(--border-default)' }}
      >
        <Building2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          No hay habitaciones activas
        </p>
        <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          Registra habitaciones en Configuración → Habitaciones para operar check-in desde aquí.
        </p>
      </div>
    )
  } else if (rooms.length === 0) {
    gridContent = (
      <div
        className="rounded-xl py-10 px-6 text-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ninguna habitación coincide con el filtro o la búsqueda.
        </p>
        {(search || filter !== 'all') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFilter('all') }}
            className="mt-3 text-xs font-medium underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
    )
  } else {
    gridContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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
    <div className="space-y-5 pb-24 max-w-7xl">
      <header>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Habitaciones
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          Vista operativa del hotel: estado en tiempo real, características y acceso rápido a check-in.
        </p>
      </header>

      {!isLoading && allRooms.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Total activas"
            value={stats.total}
            sub="habitaciones"
            icon={Building2}
            color="var(--color-primary)"
            colorBg="var(--color-primary-light)"
          />
          <KpiCard
            label="Disponibles"
            value={stats.available}
            sub="listas"
            icon={BedDouble}
            color="var(--status-available)"
            colorBg="var(--status-available-soft)"
          />
          <KpiCard
            label="Ocupadas"
            value={stats.occupied}
            sub="ahora"
            icon={Layers}
            color="var(--status-occupied)"
            colorBg="var(--status-occupied-soft)"
          />
          <KpiCard
            label="Otros estados"
            value={stats.other}
            sub="reserva, limpieza…"
            icon={Layers}
            color="var(--text-secondary)"
            colorBg="var(--bg-muted)"
          />
        </div>
      )}

      <section
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div
          className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="relative flex-1 min-w-0">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar número, tipo, piso o característica…"
              aria-label="Buscar habitaciones"
              className={cn(personInputClass, 'pl-9 pr-8 py-2')}
              style={personInputStyle}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 shrink-0">
            {FILTERS.map(({ key, label }) => {
              const isActive = filter === key
              const cfg = key === 'all' ? null : STATUS_CONFIG[key]
              const count = key === 'all'
                ? allRooms.length
                : allRooms.filter((r) => r.status === key).length

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1',
                    isActive ? 'border-transparent' : 'hover:opacity-80',
                  )}
                  style={{
                    background: isActive ? (cfg?.bg ?? 'var(--color-primary-light)') : 'transparent',
                    color: isActive ? (cfg?.color ?? 'var(--color-primary)') : 'var(--text-secondary)',
                    borderColor: isActive ? 'transparent' : 'var(--border-default)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                  {!isLoading && (
                    <span
                      className="tabular-nums opacity-80"
                      style={{ fontSize: '10px' }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {isLoading ? 'Cargando…' : `${rooms.length} de ${allRooms.length} habitaciones`}
          </span>
        </div>

        <div className="p-4">
          {gridContent}
        </div>
      </section>

      {editing && (
        <RoomStatusModal
          room={editing}
          onConfirm={handleConfirm}
          onClose={() => setEditing(null)}
          isSaving={isChanging}
        />
      )}

      {checkingIn.length > 0 && (
        <CheckInWizard
          rooms={checkingIn}
          onClose={() => setCheckingIn([])}
        />
      )}

      {selectedRooms.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-3 px-5 py-3 rounded-2xl shadow-xl max-w-[calc(100vw-2rem)]"
          style={{ background: 'var(--bg-surface)', border: '2px solid var(--color-primary)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {selectionSummaryText(selectedRooms.length)}
          </span>
          <span className="text-xs hidden sm:inline truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
            {selectedRooms.map((r) => `Hab. ${r.number}`).join(', ')}
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
