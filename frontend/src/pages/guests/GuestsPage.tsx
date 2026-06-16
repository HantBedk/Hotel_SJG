import { useEffect, useMemo, useState } from 'react'
import {
  Search, Plus, User, Edit2, ChevronLeft, ChevronRight, X,
  Users, BedDouble, UserPlus, Mail, Phone, Contact,
} from 'lucide-react'
import { useGuests } from '@/hooks/useGuests'
import { useAuth } from '@/hooks/useAuth'
import { GuestModal, GuestFormData } from './components/GuestModal'
import KpiCard from '@/pages/dashboard/components/KpiCard'
import { SkeletonCard, SkeletonText } from '@/components/ui/Skeleton'
import { DOC_LABELS, personaInitials } from '@/lib/personaRoles'
import { cn } from '@/lib/cn'
import type { Guest } from '@/types'
import type { PaginationMeta } from '@/types/pagination'
import { emptyGuestsMessage, staysBadgeStyle, staysCountLabel } from './guests-page/utils'

const TABLE_HEADERS = ['Huésped', 'Documento', 'Contacto', 'Estadías', ''] as const

const KPI_SKELETON_KEYS = ['guest-kpi-a', 'guest-kpi-b', 'guest-kpi-c'] as const

function guestDocumentLabel(guest: Guest): string {
  const type = DOC_LABELS[guest.document_type] ?? guest.document_type.toUpperCase()
  return `${type} ${guest.document_number}`
}

interface GuestRowProps {
  readonly guest: Guest
  readonly canEdit: boolean
  readonly onEdit: (guest: Guest) => void
}

function GuestRow({ guest, canEdit, onEdit }: GuestRowProps) {
  const stays = guest.stays_count ?? 0
  const badge = staysBadgeStyle(stays)

  return (
    <tr
      className={cn(
        'group transition-colors',
        canEdit && 'cursor-pointer hover:bg-[var(--bg-base)]',
      )}
      style={{ borderBottom: '1px solid var(--border-default)' }}
      onClick={canEdit ? () => onEdit(guest) : undefined}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {personaInitials(guest.full_name)}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {guest.full_name}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {guest.nationality?.name ?? 'Sin nacionalidad'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-medium">{DOC_LABELS[guest.document_type] ?? guest.document_type}</span>
        {' '}{guest.document_number}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div className="space-y-0.5 min-w-[140px]">
          {guest.phone ? (
            <div className="flex items-center gap-1.5 text-xs">
              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
              {guest.phone}
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
          )}
          {guest.email && (
            <div className="flex items-center gap-1.5 text-xs truncate max-w-[200px]" title={guest.email}>
              <Mail size={12} style={{ color: 'var(--text-muted)' }} />
              {guest.email}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: badge.background, color: badge.color }}
        >
          {stays > 0 && <BedDouble size={11} />}
          {staysCountLabel(stays)}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(guest)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]"
              style={{ color: 'var(--color-primary)' }}
              aria-label={`Editar ${guest.full_name}`}
              title="Editar"
            >
              <Edit2 size={15} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

interface GuestMobileCardProps {
  readonly guest: Guest
  readonly canEdit: boolean
  readonly onEdit: (guest: Guest) => void
}

function GuestMobileCard({ guest, canEdit, onEdit }: GuestMobileCardProps) {
  const stays = guest.stays_count ?? 0
  const badge = staysBadgeStyle(stays)

  const inner = (
    <>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
      >
        {personaInitials(guest.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {guest.full_name}
          </p>
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: badge.background, color: badge.color }}
          >
            {staysCountLabel(stays)}
          </span>
        </div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {guestDocumentLabel(guest)}
        </p>
        {(guest.phone || guest.email) && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {[guest.phone, guest.email].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </>
  )

  if (!canEdit) {
    return (
      <div
        className="flex items-start gap-2 p-2.5 rounded-lg"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
      >
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onEdit(guest)}
      className="compact-control w-full text-left flex items-start gap-2 p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
    >
      {inner}
    </button>
  )
}

function GuestsTableBody({
  isLoading,
  guests,
  search,
  canEdit,
  onEdit,
  onCreate,
}: {
  readonly isLoading: boolean
  readonly guests: Guest[]
  readonly search: string
  readonly canEdit: boolean
  readonly onEdit: (guest: Guest) => void
  readonly onCreate: () => void
}) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <SkeletonText />
        <SkeletonText />
        <SkeletonText />
        <SkeletonText />
      </div>
    )
  }

  if (guests.length === 0) {
    const filtered = search.trim().length >= 2
    return (
      <div className="p-14 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <Contact size={28} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {filtered ? 'No se encontraron huéspedes' : 'Aún no hay huéspedes registrados'}
        </p>
        <p className="text-xs mb-5 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
          {emptyGuestsMessage(search)}
        </p>
        {!filtered && canEdit && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            Registrar huésped
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden p-3 space-y-2">
        {guests.map((guest) => (
          <GuestMobileCard
            key={guest.id}
            guest={guest}
            canEdit={canEdit}
            onEdit={onEdit}
          />
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-surface)' }}>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h || 'actions'}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <GuestRow key={guest.id} guest={guest} canEdit={canEdit} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

interface GuestPaginationProps {
  readonly meta: PaginationMeta
  readonly onPageChange: (page: number) => void
}

function GuestPagination({ meta, onPageChange }: GuestPaginationProps) {
  if (meta.last_page <= 1) return null

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {meta.total} huésped{meta.total === 1 ? '' : 'es'} · página {meta.current_page} de {meta.last_page}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
          disabled={meta.current_page <= 1}
          className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-70 transition-opacity"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
          disabled={meta.current_page >= meta.last_page}
          className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-70 transition-opacity"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default function GuestsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('manage_reservations')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ guest: Guest | null } | null>(null)

  const trimmedSearch = search.trim()
  const apiSearch = trimmedSearch.length >= 2 ? trimmedSearch : undefined

  useEffect(() => {
    setPage(1)
  }, [apiSearch])

  const { guests, pagination, isLoading, isFetching, createGuest, updateGuest, isCreating, isUpdating } = useGuests({
    search: apiSearch,
    page,
    per_page: 20,
  })

  const pageStats = useMemo(() => ({
    withStays: guests.filter((g) => (g.stays_count ?? 0) > 0).length,
    newGuests: guests.filter((g) => (g.stays_count ?? 0) === 0).length,
  }), [guests])

  const total = pagination?.total ?? 0

  const handleSave = (form: GuestFormData) => {
    if (modal?.guest) {
      updateGuest({ id: modal.guest.id, payload: form }, { onSuccess: () => setModal(null) })
    } else {
      createGuest(form, { onSuccess: () => setModal(null) })
    }
  }

  const hasActiveSearch = trimmedSearch.length > 0

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
      {/* Encabezado — mismo patrón que PersonasTab / dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
            Directorio de huéspedes
          </h2>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Catálogo para check-in, reservas y consulta de historial de estadías.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setModal({ guest: null })}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shrink-0 shadow-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            Nuevo huésped
          </button>
        )}
      </div>

      {/* KPIs — KpiCard del dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
        {isLoading && !pagination
          ? KPI_SKELETON_KEYS.map((key) => <SkeletonCard key={key} />)
          : (
            <>
              <KpiCard
                label="Total registrados"
                value={total}
                sub="En este hotel"
                icon={Users}
                color="var(--color-primary)"
                colorBg="var(--color-primary-light)"
              />
              <KpiCard
                label="Con estadías"
                value={pageStats.withStays}
                sub="En esta página"
                icon={BedDouble}
                color="#16A34A"
                colorBg="#ECFDF5"
              />
              <KpiCard
                label="Sin estadías aún"
                value={pageStats.newGuests}
                sub="En esta página"
                icon={UserPlus}
                color="#F59E0B"
                colorBg="#FFFBEB"
              />
            </>
          )}
      </div>

      {/* Panel principal — estilo widget dashboard */}
      <div
        className={cn(
          'rounded-xl shadow-sm flex flex-col min-h-0 transition-opacity',
          isFetching && !isLoading && 'opacity-80',
        )}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {/* Barra de búsqueda integrada al panel */}
        <div className="p-3 border-b shrink-0" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center gap-2 shrink-0">
              <User size={13} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Huéspedes
              </span>
              {!isLoading && total > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {apiSearch ? `${guests.length} de ${total}` : total}
                </span>
              )}
            </div>
            <div className="relative flex-1 min-w-0 sm:max-w-md sm:ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                id="guests-search"
                type="search"
                placeholder="Buscar nombre, documento, teléfono o correo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-lg text-xs border outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              {hasActiveSearch && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          {trimmedSearch.length === 1 && (
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
              Escribe al menos 2 caracteres para buscar en todo el directorio.
            </p>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <GuestsTableBody
            isLoading={isLoading}
            guests={guests}
            search={search}
            canEdit={canEdit}
            onEdit={(guest) => setModal({ guest })}
            onCreate={() => setModal({ guest: null })}
          />
        </div>

        {pagination && (
          <GuestPagination meta={pagination} onPageChange={setPage} />
        )}
      </div>

      {modal !== null && (
        <GuestModal
          guest={modal.guest}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isCreating || isUpdating}
        />
      )}
    </div>
  )
}
