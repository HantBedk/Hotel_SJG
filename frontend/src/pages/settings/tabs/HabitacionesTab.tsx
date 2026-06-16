import { useMemo, useState, type SubmitEvent } from 'react'
import {
  BedDouble,
  Building2,
  DollarSign,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAdminRooms,
  useAdminRoomFeatures,
  useAdminRoomMutations,
  useAdminRoomTypes,
  useRoomTypeMutations,
} from '@/hooks/useAdmin'
import { FormField } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { RoomStatusBadge } from '@/pages/rooms/components/RoomStatusBadge'
import { RoomFeatureBadges } from '@/pages/rooms/components/RoomFeatureBadges'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { SkeletonText } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import KpiCard from '@/pages/dashboard/components/KpiCard'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Room, RoomFeature, RoomStatus, RoomType } from '@/types'

type RoomForm = {
  room_type_id: string
  number: string
  floor: string
  notes: string
  is_active: boolean
  feature_ids: string[]
}

type MassPriceForm = {
  room_type_id: string
  base_price: string
}

type StatusFilter = 'all' | RoomStatus

const EMPTY: RoomForm = {
  room_type_id: '',
  number: '',
  floor: '',
  notes: '',
  is_active: true,
  feature_ids: [],
}

const STATUS_FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'available', label: 'Disponible' },
  { value: 'occupied', label: 'Ocupada' },
  { value: 'reserved', label: 'Reservada' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'blocked', label: 'Bloqueada' },
]

const KPI_SKELETON_KEYS = ['rooms-kpi-a', 'rooms-kpi-b', 'rooms-kpi-c', 'rooms-kpi-d'] as const

function roomFormTitle(editing: Room | null): string {
  if (editing) return `Editar habitación ${editing.number}`
  return 'Nueva habitación'
}

function roomToForm(room: Room): RoomForm {
  return {
    room_type_id: room.room_type_id,
    number: room.number,
    floor: room.floor ? String(room.floor) : '',
    notes: room.notes ?? '',
    is_active: room.is_active,
    feature_ids: room.features?.map((f) => f.id) ?? [],
  }
}

function buildRoomPayload(form: RoomForm) {
  return {
    room_type_id: form.room_type_id,
    number: form.number.trim(),
    floor: form.floor ? Number.parseInt(form.floor, 10) : null,
    notes: form.notes.trim() || null,
    feature_ids: form.feature_ids,
  }
}

function toggleFeatureId(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((item) => item !== id)
  return [...ids, id]
}

function activeBadgeStyle(isActive: boolean): { background: string; color: string } {
  if (isActive) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function filterRooms(
  rooms: Room[],
  search: string,
  statusFilter: StatusFilter,
  typeFilter: string,
): Room[] {
  const term = search.trim().toLowerCase()
  return rooms.filter((room) => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false
    if (typeFilter && room.room_type_id !== typeFilter) return false
    if (!term) return true
    const typeName = room.room_type?.name?.toLowerCase() ?? ''
    return room.number.toLowerCase().includes(term) || typeName.includes(term)
  })
}

function computeRoomStats(rooms: Room[]) {
  let available = 0
  let occupied = 0
  let inactive = 0
  for (const room of rooms) {
    if (!room.is_active) inactive += 1
    if (room.status === 'available') available += 1
    if (room.status === 'occupied') occupied += 1
  }
  return { total: rooms.length, available, occupied, inactive }
}

interface RoomFormModalProps {
  readonly open: boolean
  readonly editing: Room | null
  readonly form: RoomForm
  readonly types: RoomType[]
  readonly catalogFeatures: RoomFeature[]
  readonly featuresLoading: boolean
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<RoomForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function RoomFormModal({
  open,
  editing,
  form,
  types,
  catalogFeatures,
  featuresLoading,
  saving,
  onClose,
  onChange,
  onSubmit,
}: RoomFormModalProps) {
  const noTypes = types.length === 0
  const activeFeatures = catalogFeatures.filter((f) => f.is_active)

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel={roomFormTitle(editing)}>
      <form onSubmit={onSubmit} className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {roomFormTitle(editing)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {noTypes && (
            <p
              className="text-xs rounded-lg border px-3 py-2"
              style={{ color: '#92400E', borderColor: '#FDE68A', background: '#FFFBEB' }}
            >
              Primero crea al menos un tipo en Configuración → Tipos de habitación.
            </p>
          )}

          <FormField id="room-type-id" label="Tipo de habitación" required>
            <select
              id="room-type-id"
              value={form.room_type_id}
              onChange={(e) => onChange({ room_type_id: e.target.value })}
              required
              disabled={noTypes}
              className={cn(personInputClass, 'disabled:opacity-60')}
              style={personInputStyle}
            >
              <option value="">Seleccionar tipo…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} — {formatCOP(Number.parseFloat(type.base_price))}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="room-number" label="Número" required>
              <input
                id="room-number"
                type="text"
                required
                value={form.number}
                placeholder="Ej. 101"
                onChange={(e) => onChange({ number: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
            <FormField id="room-floor" label="Piso" hint="Opcional">
              <input
                id="room-floor"
                type="number"
                min={0}
                value={form.floor}
                onChange={(e) => onChange({ floor: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
          </div>

          <FormField id="room-notes" label="Notas" hint="Uso interno, opcional">
            <input
              id="room-notes"
              type="text"
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              className={personInputClass}
              style={personInputStyle}
              placeholder="Ej. Vista al jardín"
            />
          </FormField>

          <fieldset className="border-0 p-0 m-0 min-w-0">
            <legend className="block text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Características especiales
            </legend>
            {featuresLoading && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando catálogo…</p>
            )}
            {!featuresLoading && activeFeatures.length === 0 && (
              <p
                className="text-xs rounded-lg border px-3 py-2"
                style={{ color: '#92400E', borderColor: '#FDE68A', background: '#FFFBEB' }}
              >
                No hay características activas. Créalas en Configuración → Características de habitación.
              </p>
            )}
            {!featuresLoading && activeFeatures.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeFeatures.map((feature) => (
                  <Checkbox
                    key={feature.id}
                    id={`room-feature-${feature.id}`}
                    checked={form.feature_ids.includes(feature.id)}
                    onChange={() => onChange({ feature_ids: toggleFeatureId(form.feature_ids, feature.id) })}
                    label={feature.name}
                  />
                ))}
              </div>
            )}
          </fieldset>

          {editing && (
            <Checkbox
              id="room-is-active"
              checked={form.is_active}
              onChange={(is_active) => onChange({ is_active })}
              label="Habitación activa en el catálogo"
            />
          )}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm border disabled:opacity-60"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || noTypes}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

interface MassPriceModalProps {
  readonly open: boolean
  readonly form: MassPriceForm
  readonly types: RoomType[]
  readonly pending: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<MassPriceForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function MassPriceModal({
  open,
  form,
  types,
  pending,
  onClose,
  onChange,
  onSubmit,
}: MassPriceModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" ariaLabel="Actualizar precios por tipo">
      <form onSubmit={onSubmit} className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Actualizar precios por tipo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Cambia el precio base del tipo; aplica a todas las habitaciones de esa categoría.
          </p>
          <FormField id="mass-price-type" label="Tipo de habitación" required>
            <select
              id="mass-price-type"
              value={form.room_type_id}
              onChange={(e) => onChange({ room_type_id: e.target.value })}
              required
              className={personInputClass}
              style={personInputStyle}
            >
              <option value="">Seleccionar tipo…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} — {formatCOP(Number.parseFloat(type.base_price))}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="mass-price-value" label="Nuevo precio base (COP)" required>
            <input
              id="mass-price-value"
              type="number"
              min={0}
              step={1000}
              required
              value={form.base_price}
              onChange={(e) => onChange({ base_price: e.target.value })}
              className={personInputClass}
              style={personInputStyle}
            />
          </FormField>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg text-sm border disabled:opacity-60"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {pending ? 'Actualizando…' : 'Actualizar precios'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

function formatFloorLabel(floor: number | null | undefined): string {
  if (floor == null) return 'Sin piso'
  return `Piso ${floor}`
}

interface RoomRowProps {
  readonly room: Room
  readonly onEdit: (room: Room) => void
  readonly onDelete: (room: Room) => void
}

function RoomRow({ room, onEdit, onDelete }: RoomRowProps) {
  const price = room.room_type ? Number.parseFloat(room.room_type.base_price) : Number.NaN

  return (
    <tr
      className={cn(
        'group transition-colors hover:bg-[var(--bg-base)]',
        !room.is_active && 'opacity-60',
      )}
      style={{ borderTop: '1px solid var(--border-default)' }}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-[120px]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {room.number}
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {formatFloorLabel(room.floor)}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div className="space-y-1">
          <span>{room.room_type?.name ?? '—'}</span>
          <div className="hidden xl:block">
            <RoomFeatureBadges features={room.features} />
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>
        {room.floor ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
        {Number.isNaN(price) ? '—' : formatCOP(price)}
      </td>
      <td className="py-3 px-4">
        <RoomStatusBadge status={room.status} />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={activeBadgeStyle(room.is_active)}>
          {room.is_active ? 'Activa' : 'Inactiva'}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(room)}
            aria-label={`Editar habitación ${room.number}`}
            className="compact-control p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(room)}
            aria-label={`Desactivar habitación ${room.number}`}
            className="compact-control p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            style={{ color: '#DC2626' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface RoomMobileCardProps {
  readonly room: Room
  readonly onEdit: (room: Room) => void
  readonly onDelete: (room: Room) => void
}

function RoomMobileCard({ room, onEdit, onDelete }: RoomMobileCardProps) {
  const price = room.room_type ? Number.parseFloat(room.room_type.base_price) : Number.NaN

  return (
    <div
      className={cn('rounded-xl p-4 space-y-3', !room.is_active && 'opacity-60')}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {room.number}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {room.room_type?.name ?? 'Sin tipo'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {formatFloorLabel(room.floor)}
              {!room.is_active && ' · Inactiva'}
            </p>
            <div className="mt-2">
              <RoomFeatureBadges features={room.features} max={6} />
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
          {Number.isNaN(price) ? '—' : formatCOP(price)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <RoomStatusBadge status={room.status} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(room)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(room)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: '#FECACA', color: '#DC2626' }}
          >
            Desactivar
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomsEmptyState({ onCreate, hasTypes }: { readonly onCreate: () => void; readonly hasTypes: boolean }) {
  return (
    <div
      className="rounded-xl py-12 px-6 text-center"
      style={{ background: 'var(--bg-muted)', border: '1px dashed var(--border-default)' }}
    >
      <BedDouble size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Sin habitaciones en el catálogo
      </p>
      <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
        {hasTypes
          ? 'Registra cada habitación física con número, tipo y piso para operar check-in y dashboard.'
          : 'Define primero los tipos de habitación y luego agrega cada número al catálogo.'}
      </p>
      {hasTypes && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={14} />
          Registrar habitación
        </button>
      )}
    </div>
  )
}

function RoomsFilterEmpty() {
  return (
    <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
      Ninguna habitación coincide con la búsqueda o filtros aplicados.
    </p>
  )
}

export default function HabitacionesTab() {
  const { data: rooms = [], isLoading } = useAdminRooms()
  const { create, update, remove } = useAdminRoomMutations()
  const { data: types = [] } = useAdminRoomTypes()
  const { data: catalogFeatures = [], isLoading: featuresLoading } = useAdminRoomFeatures()
  const { massPrice } = useRoomTypeMutations()

  const [form, setForm] = useState<RoomForm>(EMPTY)
  const [editing, setEditing] = useState<Room | null>(null)
  const [open, setOpen] = useState(false)
  const [massPriceOpen, setMassPriceOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [massPriceForm, setMassPriceForm] = useState<MassPriceForm>({ room_type_id: '', base_price: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState('')

  const stats = useMemo(() => computeRoomStats(rooms), [rooms])
  const filteredRooms = useMemo(
    () => filterRooms(rooms, search, statusFilter, typeFilter),
    [rooms, search, statusFilter, typeFilter],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditing(room)
    setForm(roomToForm(room))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = buildRoomPayload(form)
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: { ...payload, is_active: form.is_active } })
        toast.success(`Habitación ${form.number} actualizada.`)
      } else {
        await create.mutateAsync(payload)
        toast.success(`Habitación ${form.number} registrada.`)
      }
      close()
    } catch {
      toast.error('No se pudo guardar la habitación.')
    }
  }

  const confirmDelete = (room: Room) => {
    remove.mutate(room.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        toast.success(`Habitación ${room.number} desactivada.`)
      },
      onError: () => toast.error('No se pudo desactivar la habitación.'),
    })
  }

  const submitMassPrice = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await massPrice.mutateAsync({
        room_type_id: massPriceForm.room_type_id,
        base_price: Number.parseFloat(massPriceForm.base_price),
      })
      setMassPriceOpen(false)
      setMassPriceForm({ room_type_id: '', base_price: '' })
      toast.success('Precios base actualizados.')
    } catch {
      toast.error('No se pudieron actualizar los precios.')
    }
  }

  const roomSaving = create.isPending || update.isPending
  const hasTypes = types.length > 0

  return (
    <div className="space-y-5 max-w-6xl pb-4">
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Catálogo de habitaciones
          </h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Inventario físico del hotel: número, tipo, piso y estado operativo. Usado en dashboard, check-in y reservas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMassPriceOpen(true)}
            disabled={!hasTypes}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border disabled:opacity-50"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <DollarSign size={15} />
            Precios por tipo
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={15} />
            Nueva habitación
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI_SKELETON_KEYS.map((key) => (
            <div key={key} className="rounded-xl h-[84px] skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Total"
            value={stats.total}
            sub="habitaciones"
            icon={Building2}
            color="var(--color-primary)"
            colorBg="var(--color-primary-light)"
          />
          <KpiCard
            label="Disponibles"
            value={stats.available}
            sub="ahora"
            icon={BedDouble}
            color="var(--status-available)"
            colorBg="var(--status-available-soft)"
          />
          <KpiCard
            label="Ocupadas"
            value={stats.occupied}
            sub="en este momento"
            icon={Layers}
            color="var(--status-occupied)"
            colorBg="var(--status-occupied-soft)"
          />
          <KpiCard
            label="Inactivas"
            value={stats.inactive}
            sub="fuera de catálogo"
            icon={Trash2}
            color="var(--text-secondary)"
            colorBg="var(--bg-muted)"
          />
        </div>
      )}

      <section
        className={cn('rounded-xl shadow-sm flex flex-col min-h-0', isLoading && 'opacity-80')}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b"
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
              placeholder="Buscar por número o tipo…"
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
          <div className="flex flex-wrap gap-2 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filtrar por estado"
              className={cn(personInputClass, 'py-2 text-sm min-w-[140px]')}
              style={personInputStyle}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filtrar por tipo"
              className={cn(personInputClass, 'py-2 text-sm min-w-[140px]')}
              style={personInputStyle}
            >
              <option value="">Todos los tipos</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-default)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {filteredRooms.length} de {rooms.length} habitaciones
          </span>
        </div>

        <div className="p-4">
          {isLoading && <SkeletonText lines={5} />}

          {!isLoading && rooms.length === 0 && (
            <RoomsEmptyState onCreate={openCreate} hasTypes={hasTypes} />
          )}

          {!isLoading && rooms.length > 0 && filteredRooms.length === 0 && (
            <RoomsFilterEmpty />
          )}

          {!isLoading && filteredRooms.length > 0 && (
            <>
              <div className="hidden md:block overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Número</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Tipo</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Piso</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Precio</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">Estado</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Catálogo</th>
                      <th className="py-2.5 px-4 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => (
                      <RoomRow
                        key={room.id}
                        room={room}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredRooms.map((room) => (
                  <RoomMobileCard
                    key={room.id}
                    room={room}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <RoomFormModal
        open={open}
        editing={editing}
        form={form}
        types={types}
        catalogFeatures={catalogFeatures}
        featuresLoading={featuresLoading}
        saving={roomSaving}
        onClose={close}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={submit}
      />

      <MassPriceModal
        open={massPriceOpen}
        form={massPriceForm}
        types={types}
        pending={massPrice.isPending}
        onClose={() => setMassPriceOpen(false)}
        onChange={(patch) => setMassPriceForm((f) => ({ ...f, ...patch }))}
        onSubmit={submitMassPrice}
      />

      <DeleteConfirmDialog
        target={deleteTarget}
        title="Desactivar habitación"
        message={
          deleteTarget
            ? `¿Desactivar la habitación ${deleteTarget.number}? No aparecerá en operaciones hasta reactivarla.`
            : ''
        }
        confirmLabel="Sí, desactivar"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
