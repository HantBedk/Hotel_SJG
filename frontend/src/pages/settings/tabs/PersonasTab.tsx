import { useMemo, useState, type ReactNode } from 'react'
import {
  Search, Contact, Plus, Edit2, Trash2, X, Users, UserCheck, Building2, Mail, Phone,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminPersonas, useAdminPersonaMutations, useAdminRoles } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { useHotelStore } from '@/store/hotelStore'
import { extractApiError } from '@/lib/apiError'
import { hasValidHotelAssignment, rolesRequireHotelAssignment } from '@/lib/staffRoles'
import {
  DOC_LABELS,
  PERSONA_ROLE_FILTER_OPTIONS,
  personaInitials,
  personaRoleLabel,
} from '@/lib/personaRoles'
import { PersonaRoleBadgeList } from '@/components/settings/PersonaRoleBadge'
import { SkeletonText } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { PersonaFormModal, type PersonaFormData } from '../components/PersonaFormModal'
import type { AdminPersona } from '@/types/admin'
import { cn } from '@/lib/cn'

const STAFF_ROLES_SET = new Set(['admin', 'receptionist', 'housekeeping', 'maintenance', 'superadmin'])

function activeAccountStyle(active: boolean): { background: string; color: string } {
  if (active) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function buildPayload(form: PersonaFormData) {
  const payload = {
    primer_nombre: form.primer_nombre,
    segundo_nombre: form.segundo_nombre || undefined,
    primer_apellido: form.primer_apellido,
    segundo_apellido: form.segundo_apellido || undefined,
    document_type: form.document_type,
    document_number: form.document_number,
    email: form.email || null,
    phone: form.phone || null,
    nationality_id: form.nationality_id || null,
    birth_date: form.birth_date || null,
    notes: form.notes || null,
    roles: form.roles,
  }
  if (rolesRequireHotelAssignment(form.roles)) {
    return { ...payload, hotel_ids: form.hotel_ids }
  }
  return payload
}

function canEditPersona(persona: AdminPersona, isSuperadmin: boolean): boolean {
  if (isSuperadmin) return true
  return !persona.roles.includes('superadmin')
}

function isStaffPersona(persona: AdminPersona): boolean {
  return persona.roles.some((r) => STAFF_ROLES_SET.has(r))
}

interface StatCardProps {
  readonly label: string
  readonly value: number
  readonly icon: ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 min-w-[140px]"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>{value}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

function HotelBadges({ persona }: { readonly persona: AdminPersona }) {
  if (!rolesRequireHotelAssignment(persona.roles)) {
    return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
  }
  const names = persona.hotel_names ?? []
  if (names.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
        style={{ background: '#FEE2E2', color: '#991B1B' }}
      >
        <Building2 size={11} />
        Sin asignar
      </span>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {names.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          <Building2 size={11} />
          {name}
        </span>
      ))}
    </div>
  )
}

function LoginBadge({ persona }: { readonly persona: AdminPersona }) {
  if (!persona.has_login) {
    return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin cuenta</span>
  }
  const active = persona.user_active ?? false
  return (
    <div className="space-y-1">
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={activeAccountStyle(active)}>
        {active ? 'Activa' : 'Inactiva'}
      </span>
      <div className="text-xs truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }} title={persona.user_email ?? ''}>
        {persona.user_email}
      </div>
    </div>
  )
}

interface PersonaRowProps {
  readonly persona: AdminPersona
  readonly isSuperadmin: boolean
  readonly onEdit: (persona: AdminPersona) => void
  readonly onDelete: (persona: AdminPersona) => void
}

function deleteButtonTitle(persona: AdminPersona): string {
  if (persona.has_login) return 'Tiene cuenta de usuario'
  return 'Eliminar'
}

function PersonaRow({ persona, isSuperadmin, onEdit, onDelete }: PersonaRowProps) {
  const editable = canEditPersona(persona, isSuperadmin)

  return (
    <tr
      className={cn(
        'group transition-colors',
        editable && 'cursor-pointer hover:bg-[var(--bg-base)]',
      )}
      style={{ borderBottom: '1px solid var(--border-default)' }}
      onClick={editable ? () => onEdit(persona) : undefined}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {personaInitials(persona.full_name)}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {persona.full_name}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {persona.nationality_name ?? 'Sin nacionalidad'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-medium">{DOC_LABELS[persona.document_type] ?? persona.document_type}</span>
        {' '}{persona.document_number}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div className="space-y-0.5 min-w-[140px]">
          {persona.phone ? (
            <div className="flex items-center gap-1.5 text-xs">
              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
              {persona.phone}
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
          )}
          {persona.email && (
            <div className="flex items-center gap-1.5 text-xs truncate max-w-[180px]" title={persona.email}>
              <Mail size={12} style={{ color: 'var(--text-muted)' }} />
              {persona.email}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 min-w-[140px]">
        <PersonaRoleBadgeList roles={persona.roles} compact />
      </td>
      <td className="px-4 py-3 min-w-[120px]">
        <HotelBadges persona={persona} />
      </td>
      <td className="px-4 py-3">
        <LoginBadge persona={persona} />
      </td>
      <td className="px-4 py-3 text-sm text-center tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {persona.stays_count}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {editable && (
          <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(persona)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]"
              style={{ color: 'var(--color-primary)' }}
              aria-label={`Editar ${persona.full_name}`}
              title="Editar"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(persona)}
              disabled={persona.has_login}
              className="compact-control p-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-colors disabled:opacity-30"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Eliminar"
              title={deleteButtonTitle(persona)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

const TABLE_HEADERS = [
  'Persona',
  'Documento',
  'Contacto',
  'Roles',
  'Hoteles',
  'Cuenta',
  'Estadías',
  '',
] as const

function PersonasTableBody({
  isLoading,
  personas,
  search,
  roleFilter,
  isSuperadmin,
  onEdit,
  onDelete,
  onCreate,
}: {
  readonly isLoading: boolean
  readonly personas: AdminPersona[]
  readonly search: string
  readonly roleFilter: string
  readonly isSuperadmin: boolean
  readonly onEdit: (persona: AdminPersona) => void
  readonly onDelete: (persona: AdminPersona) => void
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

  if (personas.length === 0) {
    const filtered = search.length >= 2 || roleFilter
    return (
      <div className="p-14 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <Contact size={28} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {filtered ? 'No se encontraron personas' : 'Aún no hay personas registradas'}
        </p>
        <p className="text-xs mb-5 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
          {filtered
            ? 'Prueba con otro término de búsqueda o quita el filtro de rol.'
            : 'Crea la primera persona para gestionar huéspedes y personal del hotel.'}
        </p>
        {!filtered && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            Nueva persona
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
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
          {personas.map((persona) => (
            <PersonaRow
              key={persona.id}
              persona={persona}
              isSuperadmin={isSuperadmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PersonasTab() {
  const { hasRole } = useAuth()
  const isSuperadmin = hasRole('superadmin')
  const assignableHotels = useHotelStore((s) => s.hotels)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ persona: AdminPersona | null } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminPersona | null>(null)

  const filters = useMemo(() => ({
    search: search.length >= 2 ? search : undefined,
    role: roleFilter || undefined,
    page,
  }), [search, roleFilter, page])

  const { data, isLoading } = useAdminPersonas(filters)
  const { data: rolesData } = useAdminRoles()
  const { create, update, remove } = useAdminPersonaMutations()

  const personas = data?.data ?? []
  const total = data?.total ?? 0
  const lastPage = data?.last_page ?? 1

  const pageStats = useMemo(() => ({
    staff: personas.filter(isStaffPersona).length,
    guests: personas.filter((p) => p.roles.includes('guest')).length,
  }), [personas])

  const roleOptions = useMemo(() => {
    const names = (rolesData ?? []).map((r) => r.name)
    if (isSuperadmin) return names
    return names.filter((r) => r !== 'superadmin')
  }, [rolesData, isSuperadmin])

  const visibleRoleFilters = useMemo(() => {
    if (isSuperadmin) return PERSONA_ROLE_FILTER_OPTIONS
    return PERSONA_ROLE_FILTER_OPTIONS.filter((o) => o.value !== 'superadmin')
  }, [isSuperadmin])

  const handleSave = (form: PersonaFormData) => {
    if (!hasValidHotelAssignment(form.roles, form.hotel_ids, assignableHotels.length)) {
      toast.error('Selecciona al menos un hotel para los roles de personal.')
      return
    }
    const payload = buildPayload(form)
    if (modal?.persona) {
      update.mutate(
        { id: modal.persona.id, data: payload },
        {
          onSuccess: () => { toast.success('Persona actualizada.'); setModal(null) },
          onError: (err) => toast.error(extractApiError(err, 'Error al actualizar persona.')),
        },
      )
    } else {
      create.mutate(payload, {
        onSuccess: () => { toast.success('Persona creada.'); setModal(null) },
        onError: (err) => toast.error(extractApiError(err, 'Error al crear persona.')),
      })
    }
  }

  const confirmDelete = (persona: AdminPersona) => {
    remove.mutate(persona.id, {
      onSuccess: () => { toast.success('Persona eliminada.'); setDeleteTarget(null) },
      onError: (err) => { toast.error(extractApiError(err, 'Error al eliminar persona.')); setDeleteTarget(null) },
    })
  }

  const isSaving = create.isPending || update.isPending
  const hasActiveFilters = search.length > 0 || roleFilter !== ''

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
            Directorio de personas
          </h2>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Huéspedes y personal en un solo catálogo. Los roles de personal requieren correo real y hoteles asignados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ persona: null })}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={16} />
          Nueva persona
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard label="Total registradas" value={total} icon={<Users size={16} />} />
        <StatCard label="En esta página (personal)" value={pageStats.staff} icon={<UserCheck size={16} />} />
        <StatCard label="En esta página (huésped)" value={pageStats.guests} icon={<Contact size={16} />} />
      </div>

      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar nombre, documento, teléfono o correo…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--bg-input)]"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Rol:</span>
          {visibleRoleFilters.map((opt) => {
            const active = roleFilter === opt.value
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => { setRoleFilter(opt.value); setPage(1) }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  active ? 'text-white' : 'hover:opacity-90',
                )}
                style={{
                  background: active ? 'var(--color-primary)' : 'var(--bg-base)',
                  borderColor: active ? 'var(--color-primary)' : 'var(--border-default)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            )
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setRoleFilter(''); setPage(1) }}
              className="text-xs ml-1 underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        {search.length === 1 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Escribe al menos 2 caracteres para buscar.</p>
        )}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <PersonasTableBody
          isLoading={isLoading}
          personas={personas}
          search={search}
          roleFilter={roleFilter}
          isSuperadmin={isSuperadmin}
          onEdit={(persona) => setModal({ persona })}
          onDelete={setDeleteTarget}
          onCreate={() => setModal({ persona: null })}
        />
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>
            {total} persona{total === 1 ? '' : 's'}
            {roleFilter ? ` · filtro: ${personaRoleLabel(roleFilter)}` : ''}
          </span>
          {lastPage > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40 text-sm"
                style={{ borderColor: 'var(--border-default)' }}
              >
                Anterior
              </button>
              <span className="tabular-nums text-xs">Página {page} de {lastPage}</span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40 text-sm"
                style={{ borderColor: 'var(--border-default)' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <PersonaFormModal
          persona={modal.persona}
          roleOptions={roleOptions}
          assignableHotels={assignableHotels}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isSaving}
        />
      )}

      <DeleteConfirmDialog
        target={deleteTarget}
        title="Eliminar persona"
        message={
          deleteTarget
            ? `¿Estás seguro de eliminar a ${deleteTarget.full_name}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
