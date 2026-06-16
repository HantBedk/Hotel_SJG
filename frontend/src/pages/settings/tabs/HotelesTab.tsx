import { useMemo, useState, type SubmitEvent } from 'react'
import {
  Building2,
  Check,
  Hash,
  Mail,
  MapPin,
  Network,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createHotelApi,
  deleteHotelApi,
  getAdminHotelsApi,
  updateHotelApi,
} from '@/services/admin.service'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import { useAuth } from '@/hooks/useAuth'
import { useSwitchHotel } from '@/hooks/useSwitchHotel'
import { useHotelStore } from '@/store/hotelStore'
import type { HotelSummary } from '@/types'
import { FormField } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { CitySelect } from '@/components/forms/CitySelect'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { SkeletonText } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import KpiCard from '@/pages/dashboard/components/KpiCard'
import { cn } from '@/lib/cn'

type HotelForm = {
  name: string
  nit: string
  address: string
  phone: string
  email: string
  city: string
  country: string
}

type AdminHotelDetail = HotelSummary & Partial<HotelForm>

type FormFieldKey = keyof Omit<HotelForm, 'country'>

const FIELD_LABELS: Record<FormFieldKey, string> = {
  name: 'Nombre comercial',
  nit: 'NIT',
  city: 'Ciudad',
  address: 'Dirección',
  phone: 'Teléfono',
  email: 'Correo electrónico',
}

const EMPTY: HotelForm = {
  name: '',
  nit: '',
  address: '',
  phone: '',
  email: '',
  city: '',
  country: 'CO',
}

const KPI_SKELETON_KEYS = ['hotels-kpi-total', 'hotels-kpi-active'] as const

function hotelFieldId(field: FormFieldKey): string {
  return `hotel-field-${field}`
}

function hotelFormTitle(editing: HotelSummary | null): string {
  if (editing) return 'Editar establecimiento'
  return 'Nuevo establecimiento'
}

function hotelToForm(hotel: HotelSummary): HotelForm {
  const detail = hotel as AdminHotelDetail
  return {
    name: detail.name ?? '',
    nit: detail.nit ?? '',
    address: detail.address ?? '',
    phone: detail.phone ?? '',
    email: detail.email ?? '',
    city: detail.city ?? '',
    country: detail.country ?? 'CO',
  }
}

function displayMeta(value: string | null | undefined): string {
  if (value?.trim()) return value.trim()
  return '—'
}

function filterHotels(hotels: HotelSummary[], term: string): HotelSummary[] {
  const q = term.trim().toLowerCase()
  if (!q) return hotels

  return hotels.filter((hotel) => {
    const detail = hotel as AdminHotelDetail
    const haystack = [
      hotel.name,
      hotel.city ?? '',
      detail.nit ?? '',
      detail.address ?? '',
      detail.phone ?? '',
      detail.email ?? '',
    ].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

interface HotelFormModalProps {
  readonly open: boolean
  readonly editing: HotelSummary | null
  readonly form: HotelForm
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (field: FormFieldKey, value: string) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function HotelFormModal({
  open,
  editing,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: HotelFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel={hotelFormTitle(editing)}>
      <form onSubmit={onSubmit} className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {hotelFormTitle(editing)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id={hotelFieldId('name')} label={FIELD_LABELS.name} required className="sm:col-span-2">
              <input
                id={hotelFieldId('name')}
                type="text"
                required
                value={form.name}
                placeholder="Ej. Hotel Centro Plaza"
                onChange={(e) => onChange('name', e.target.value)}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>

            <FormField id={hotelFieldId('nit')} label={FIELD_LABELS.nit} required>
              <input
                id={hotelFieldId('nit')}
                type="text"
                required
                value={form.nit}
                placeholder="900.123.456-7"
                onChange={(e) => onChange('nit', e.target.value)}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>

            <FormField id={hotelFieldId('city')} label={FIELD_LABELS.city}>
              <CitySelect
                id={hotelFieldId('city')}
                value={form.city}
                onChange={(city) => onChange('city', city)}
              />
            </FormField>

            <FormField id={hotelFieldId('address')} label={FIELD_LABELS.address} className="sm:col-span-2">
              <input
                id={hotelFieldId('address')}
                type="text"
                value={form.address}
                placeholder="Calle, número, barrio"
                onChange={(e) => onChange('address', e.target.value)}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>

            <FormField id={hotelFieldId('phone')} label={FIELD_LABELS.phone}>
              <input
                id={hotelFieldId('phone')}
                type="tel"
                value={form.phone}
                placeholder="+57 300 000 0000"
                onChange={(e) => onChange('phone', e.target.value)}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>

            <FormField id={hotelFieldId('email')} label={FIELD_LABELS.email}>
              <input
                id={hotelFieldId('email')}
                type="email"
                value={form.email}
                placeholder="contacto@hotel.com"
                onChange={(e) => onChange('email', e.target.value)}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
          </div>
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
            disabled={saving}
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

interface HotelCardProps {
  readonly hotel: HotelSummary
  readonly isActive: boolean
  readonly canManage: boolean
  readonly canDelete: boolean
  readonly canSwitch: boolean
  readonly isSwitching: boolean
  readonly onActivate: (hotelId: string) => void
  readonly onEdit: (hotel: HotelSummary) => void
  readonly onDelete: (hotel: HotelSummary) => void
}

function HotelCard({
  hotel,
  isActive,
  canManage,
  canDelete,
  canSwitch,
  isSwitching,
  onActivate,
  onEdit,
  onDelete,
}: HotelCardProps) {
  const detail = hotel as AdminHotelDetail

  return (
    <article
      className={cn(
        'rounded-xl overflow-hidden flex flex-col transition-shadow hover:shadow-md',
        isActive && 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--bg-base)]',
      )}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--border-default)'}`,
      }}
    >
      <div className="p-4 flex-1 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden"
            style={{
              background: isActive ? 'var(--color-primary-light)' : 'var(--bg-muted)',
              color: 'var(--color-primary)',
            }}
          >
            {hotel.logo_url ? (
              <img src={hotel.logo_url} alt="" className="h-full w-full object-contain" />
            ) : (
              <Building2 size={22} aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                {hotel.name}
              </h3>
              {isActive && (
                <span
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  <Check size={11} aria-hidden="true" />
                  Activo
                </span>
              )}
            </div>
            <p className="text-xs mt-1 flex items-center gap-1 truncate" style={{ color: 'var(--text-muted)' }}>
              <Hash size={11} className="shrink-0" aria-hidden="true" />
              {displayMeta(detail.nit)}
              <span className="opacity-40">·</span>
              <MapPin size={11} className="shrink-0" aria-hidden="true" />
              {displayMeta(hotel.city)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {detail.address?.trim() && (
            <p className="flex items-start gap-2 min-w-0">
              <MapPin size={13} className="shrink-0 mt-0.5 opacity-70" aria-hidden="true" />
              <span className="line-clamp-2">{detail.address}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {detail.phone?.trim() && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Phone size={12} className="shrink-0 opacity-70" aria-hidden="true" />
                <span className="truncate">{detail.phone}</span>
              </span>
            )}
            {detail.email?.trim() && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Mail size={12} className="shrink-0 opacity-70" aria-hidden="true" />
                <span className="truncate">{detail.email}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 px-4 py-3 border-t"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
      >
        {canSwitch && !isActive && (
          <button
            type="button"
            disabled={isSwitching}
            onClick={() => onActivate(hotel.id)}
            className="flex-1 min-w-[7rem] py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            Activar
          </button>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => onEdit(hotel)}
            className={cn(
              'py-2 rounded-lg text-xs font-medium border transition-colors hover:opacity-90',
              canSwitch && !isActive ? 'px-3' : 'flex-1 min-w-[5rem]',
            )}
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Pencil size={12} aria-hidden="true" />
              Editar
            </span>
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(hotel)}
            className="py-2 px-3 rounded-lg text-xs font-medium border transition-colors hover:opacity-90"
            style={{ borderColor: '#FECACA', color: '#DC2626' }}
            aria-label={`Eliminar ${hotel.name}`}
          >
            <Trash2 size={12} className="inline" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  )
}

function HotelsEmptyState({
  canManage,
  onCreate,
}: {
  readonly canManage: boolean
  readonly onCreate: () => void
}) {
  return (
    <div
      className="rounded-xl py-12 px-6 text-center"
      style={{ background: 'var(--bg-muted)', border: '1px dashed var(--border-default)' }}
    >
      <Network size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Sin establecimientos registrados
      </p>
      <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
        Crea el primer hotel de la red para configurar habitaciones, tarifas y operación multitenant.
      </p>
      {canManage && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={14} />
          Crear primer hotel
        </button>
      )}
    </div>
  )
}

export default function HotelesTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_hotels')
  const qc = useQueryClient()
  const currentHotelId = useHotelStore((s) => s.currentHotelId)
  const canSwitchHotel = useHotelStore((s) => s.canSwitchHotel)
  const isSwitchingHotel = useHotelStore((s) => s.isSwitchingHotel)
  const switchHotel = useSwitchHotel()

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: hotelQueryKey('admin', 'hotels'),
    queryFn: getAdminHotelsApi,
  })

  const [search, setSearch] = useState('')
  const [form, setForm] = useState<HotelForm>(EMPTY)
  const [editing, setEditing] = useState<HotelSummary | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<HotelSummary | null>(null)

  const activeHotel = hotels.find((h) => h.id === currentHotelId)
  const filteredHotels = useMemo(() => filterHotels(hotels, search), [hotels, search])
  const showSearch = hotels.length > 1

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'hotels') })
    qc.invalidateQueries({ queryKey: hotelQueryKey('admin', 'hotel') })
  }

  const createMut = useMutation({
    mutationFn: createHotelApi,
    onSuccess: () => { toast.success('Hotel creado.'); invalidate(); setOpen(false) },
    onError: () => toast.error('No se pudo crear el hotel.'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateHotelApi(id, data),
    onSuccess: () => { toast.success('Hotel actualizado.'); invalidate(); setOpen(false) },
    onError: () => toast.error('No se pudo actualizar.'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteHotelApi,
    onSuccess: () => { toast.success('Hotel eliminado.'); invalidate() },
    onError: () => toast.error('No se pudo eliminar.'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (hotel: HotelSummary) => {
    setEditing(hotel)
    setForm(hotelToForm(hotel))
    setOpen(true)
  }

  const confirmDelete = (hotel: HotelSummary) => {
    deleteMut.mutate(hotel.id, { onSuccess: () => setDeleteTarget(null) })
  }

  const handleActivate = (hotelId: string) => {
    switchHotel(hotelId).catch(() => {
      toast.error('No se pudo cambiar de hotel.')
    })
  }

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  const handleFieldChange = (field: FormFieldKey, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-5 max-w-5xl pb-4">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Red de hoteles
          </h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--text-muted)' }}>
            Establecimientos de la plataforma. El hotel activo se cambia desde el menú lateral y define
            los datos operativos que ves en el resto del sistema.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={15} />
            Nuevo hotel
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isLoading
          ? KPI_SKELETON_KEYS.map((key) => (
            <div key={key} className="h-[84px] rounded-xl animate-pulse" style={{ background: 'var(--bg-input)' }} />
          ))
          : (
            <>
              <KpiCard
                label="Establecimientos"
                value={hotels.length}
                sub={hotels.length === 1 ? '1 hotel en la red' : `${hotels.length} hoteles en la red`}
                icon={Network}
                color="var(--color-primary)"
                colorBg="var(--color-primary-light)"
              />
              <KpiCard
                label="Hotel activo"
                value={activeHotel?.name ?? '—'}
                sub={canSwitchHotel && hotels.length > 1 ? 'Cámbialo en el menú lateral' : 'Sesión actual'}
                icon={Building2}
                color="#059669"
                colorBg="#D1FAE5"
              />
            </>
          )}
      </div>

      <section
        className={cn('rounded-xl shadow-sm flex flex-col min-h-0', isLoading && 'opacity-80')}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Network size={16} style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              Catálogo de establecimientos
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isLoading && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
              >
                {filteredHotels.length} / {hotels.length}
              </span>
            )}
          </div>
        </div>

        {showSearch && !isLoading && (
          <div className="px-4 pt-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, NIT, ciudad…"
                aria-label="Buscar hotel"
                className={cn(personInputClass, 'pl-9 pr-8 py-2 text-sm')}
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
          </div>
        )}

        <div className="p-4">
          {isLoading && <SkeletonText lines={4} />}

          {!isLoading && hotels.length === 0 && (
            <HotelsEmptyState canManage={canManage} onCreate={openCreate} />
          )}

          {!isLoading && hotels.length > 0 && filteredHotels.length === 0 && (
            <div
              className="rounded-xl py-10 px-6 text-center"
              style={{ background: 'var(--bg-muted)', border: '1px dashed var(--border-default)' }}
            >
              <Search size={28} className="mx-auto mb-2 opacity-50" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Sin resultados
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Prueba otro término o limpia la búsqueda.
              </p>
            </div>
          )}

          {!isLoading && filteredHotels.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  isActive={hotel.id === currentHotelId}
                  canManage={canManage}
                  canDelete={canManage && hotels.length > 1}
                  canSwitch={canSwitchHotel && hotels.length > 1}
                  isSwitching={isSwitchingHotel}
                  onActivate={handleActivate}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <HotelFormModal
        open={open}
        editing={editing}
        form={form}
        saving={saving}
        onClose={() => setOpen(false)}
        onChange={handleFieldChange}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        target={deleteTarget}
        title="Eliminar hotel"
        message={
          deleteTarget
            ? `¿Estás seguro de eliminar el hotel ${deleteTarget.name}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
