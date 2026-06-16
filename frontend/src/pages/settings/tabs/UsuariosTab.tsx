import { useState, type SubmitEvent } from 'react'
import { Plus, Pencil, UserX } from 'lucide-react'
import { useAdminUsers, useAdminUserMutations, useAdminRoles } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { useHotelStore } from '@/store/hotelStore'
import { emptyPersonName, personNameFromGuest } from '@/types/person'
import { UserFormModal, type UserForm } from '../components/UserFormModal'

const EMPTY: UserForm = {
  ...emptyPersonName(),
  document_number: '',
  phone: '',
  nationality_id: '',
  email: '',
  password: '',
  role: 'receptionist',
  is_active: true,
  hotel_ids: [],
}

const LOGIN_ROLES = new Set(['admin', 'superadmin', 'receptionist'])

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super administrador',
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  housekeeping: 'Camarera',
  maintenance: 'Mantenimiento',
}

function roleNeedsLogin(role: string): boolean {
  return LOGIN_ROLES.has(role)
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return '—'
  return ROLE_LABELS[role] ?? role
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (slug) return slug
  return 'user'
}

function generatePlaceholderEmail(form: UserForm, role: string): string {
  const displayName = [form.primer_nombre, form.primer_apellido].filter(Boolean).join(' ')
  const stamp = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 6)
  return `${slugify(role)}-${slugify(displayName)}-${stamp}${rnd}@personal.local`
}

function generatePlaceholderPassword(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function activeBadgeStyle(isActive: boolean): { background: string; color: string } {
  if (isActive) return { background: '#D1FAE5', color: '#065F46' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

function activeBadgeLabel(isActive: boolean): string {
  if (isActive) return 'Activo'
  return 'Inactivo'
}

function isPersonalEmail(email: string | undefined): boolean {
  return Boolean(email?.endsWith('@personal.local'))
}

function filterVisibleUsers(users: AdminUser[], isSuperadmin: boolean): AdminUser[] {
  if (isSuperadmin) return users
  return users.filter((user) => user.role !== 'superadmin')
}

function filterRoleNames(roleNames: string[], isSuperadmin: boolean): string[] {
  if (isSuperadmin) return roleNames
  return roleNames.filter((role) => role !== 'superadmin')
}

function canEditUser(user: AdminUser, isSuperadmin: boolean): boolean {
  if (user.role === 'superadmin' && !isSuperadmin) return false
  return true
}

function canDeactivateUser(user: AdminUser, currentUserId: string | undefined): boolean {
  if (user.id === currentUserId) return false
  if (user.role === 'superadmin') return false
  return true
}

function userToForm(user: AdminUser): UserForm {
  const name = personNameFromGuest(user)
  return {
    ...name,
    document_number: user.document_number ?? '',
    phone: user.phone ?? '',
    nationality_id: user.nationality_id ?? '',
    email: user.email,
    password: '',
    role: user.role ?? 'receptionist',
    is_active: user.is_active,
    hotel_ids: user.hotel_ids ?? [],
  }
}

function requiresHotelAssignment(role: string): boolean {
  return role !== 'superadmin'
}

function hasValidHotelAssignment(role: string, hotelIds: string[], assignableCount: number): boolean {
  if (!requiresHotelAssignment(role) || assignableCount === 0) return true
  return hotelIds.length >= 1
}

function buildUpdatePayload(form: UserForm): Partial<UserForm> {
  const needsLogin = roleNeedsLogin(form.role)
  const payload: Partial<UserForm> = {
    primer_nombre: form.primer_nombre,
    segundo_nombre: form.segundo_nombre,
    primer_apellido: form.primer_apellido,
    segundo_apellido: form.segundo_apellido,
    document_number: form.document_number,
    phone: form.phone,
    nationality_id: form.nationality_id,
    role: form.role,
    is_active: form.is_active,
    hotel_ids: form.role === 'superadmin' ? [] : form.hotel_ids,
  }
  if (needsLogin) {
    payload.email = form.email
    if (form.password) payload.password = form.password
  }
  return payload
}

function buildCreatePayload(form: UserForm): UserForm {
  const needsLogin = roleNeedsLogin(form.role)
  let payload: UserForm
  if (needsLogin) {
    payload = form
  } else {
    payload = {
      ...form,
      email: generatePlaceholderEmail(form, form.role),
      password: generatePlaceholderPassword(),
    }
  }
  if (payload.role === 'superadmin') {
    return { ...payload, hotel_ids: [] }
  }
  return payload
}

interface UserTableRowProps {
  readonly user: AdminUser
  readonly currentUserId: string | undefined
  readonly isSuperadmin: boolean
  readonly onEdit: (user: AdminUser) => void
  readonly onDeactivate: (user: AdminUser) => void
}

function UserTableRow({ user, currentUserId, isSuperadmin, onEdit, onDeactivate }: UserTableRowProps) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
      <td className="py-2" style={{ color: 'var(--text-primary)' }}>
        {user.name}
        {user.id === currentUserId && (
          <span className="ml-1 text-xs" style={{ color: 'var(--color-primary)' }}>(yo)</span>
        )}
      </td>
      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
        {isPersonalEmail(user.email)
          ? <span style={{ color: 'var(--text-muted)' }}>—</span>
          : user.email}
      </td>
      <td className="py-2">
        <span
          className="px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          {roleLabel(user.role)}
        </span>
      </td>
      <td className="py-2">
        <span className="px-1.5 py-0.5 rounded text-xs" style={activeBadgeStyle(user.is_active)}>
          {activeBadgeLabel(user.is_active)}
        </span>
      </td>
      <td className="py-2">
        <div className="flex gap-2 justify-end">
          {canEditUser(user, isSuperadmin) && (
            <button
              type="button"
              onClick={() => onEdit(user)}
              aria-label={`Editar ${user.name}`}
              style={{ color: 'var(--color-primary)' }}
            >
              <Pencil size={13} />
            </button>
          )}
          {canDeactivateUser(user, currentUserId) && (
            <button
              type="button"
              onClick={() => onDeactivate(user)}
              title="Desactivar"
              aria-label={`Desactivar ${user.name}`}
              style={{ color: '#EF4444' }}
            >
              <UserX size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function UsuariosTab() {
  const { data: users = [], isLoading } = useAdminUsers()
  const { create, update, remove } = useAdminUserMutations()
  const { data: roles = [] } = useAdminRoles()
  const { user: me, hasRole } = useAuth()
  const assignableHotels = useHotelStore((s) => s.hotels)

  const [form, setForm] = useState<UserForm>(EMPTY)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const isSuperadmin = hasRole('superadmin')
  const visibleUsers = filterVisibleUsers(users, isSuperadmin)
  const roleNames = filterRoleNames(roles.map((r) => r.name), isSuperadmin)

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...EMPTY,
      hotel_ids: assignableHotels.length === 1 ? [assignableHotels[0].id] : [],
    })
    setOpen(true)
  }

  const openEdit = (user: AdminUser) => {
    setEditing(user)
    setForm(userToForm(user))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.primer_nombre.trim() || !form.primer_apellido.trim()) {
      alert('Primer nombre y primer apellido son obligatorios.')
      return
    }
    if (!hasValidHotelAssignment(form.role, form.hotel_ids, assignableHotels.length)) {
      alert('Asigna al menos un hotel al usuario.')
      return
    }
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: buildUpdatePayload(form) })
    } else {
      await create.mutateAsync(buildCreatePayload(form))
    }
    close()
  }

  const confirmDeactivate = (user: AdminUser) => {
    remove.mutate(user.id, { onSuccess: () => setDeleteTarget(null) })
  }

  const saving = create.isPending || update.isPending

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Usuarios</h2>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {isLoading ? (
        <SkeletonText lines={4} />
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th className="text-left py-2 font-medium">Nombre</th>
              <th className="text-left py-2 font-medium">Email</th>
              <th className="text-left py-2 font-medium">Rol</th>
              <th className="text-left py-2 font-medium">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                currentUserId={me?.id}
                isSuperadmin={isSuperadmin}
                onEdit={openEdit}
                onDeactivate={setDeleteTarget}
              />
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <UserFormModal
          editing={editing}
          form={form}
          roleNames={roleNames}
          assignableHotels={assignableHotels}
          saving={saving}
          onClose={close}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onHotelIdsChange={(hotelIds) => setForm((f) => ({ ...f, hotel_ids: hotelIds }))}
          onSubmit={submit}
        />
      )}

      <DeleteConfirmDialog
        target={deleteTarget}
        title="Desactivar usuario"
        message={
          deleteTarget
            ? `¿Estás seguro de desactivar a ${deleteTarget.name}? No podrá iniciar sesión.`
            : ''
        }
        confirmLabel="Sí, desactivar"
        loading={remove.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
