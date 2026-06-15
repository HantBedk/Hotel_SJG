import { useState, useEffect, type SubmitEvent } from 'react'
import { Plus, Pencil, UserX, X } from 'lucide-react'
import { useAdminUsers, useAdminUserMutations, useAdminRoles } from '@/hooks/useAdmin'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { AdminUser, HotelSummary } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useHotelStore } from '@/store/hotelStore'
import { cn } from '@/lib/cn'

type UserForm = {
  name: string
  document_number: string
  phone: string
  email: string
  password: string
  role: string
  is_active: boolean
  hotel_ids: string[]
}

const EMPTY: UserForm = {
  name: '',
  document_number: '',
  phone: '',
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

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return { dialogRef, backdropClassName }
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

function generatePlaceholderEmail(name: string, role: string): string {
  const stamp = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 6)
  return `${slugify(role)}-${slugify(name)}-${stamp}${rnd}@personal.local`
}

function generatePlaceholderPassword(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function userFieldId(field: string): string {
  return `user-field-${field}`
}

function userFormTitle(editing: AdminUser | null): string {
  if (editing) return `Editar: ${editing.name}`
  return 'Nuevo usuario'
}

function userSaveLabel(saving: boolean): string {
  if (saving) return 'Guardando…'
  return 'Guardar'
}

function passwordFieldLabel(editing: AdminUser | null): string {
  if (editing) return 'Contraseña (dejar vacío para no cambiar)'
  return 'Contraseña *'
}

function hotelsAssignmentLabel(): string {
  return 'Hoteles asignados'
}

function hotelsAssignmentHint(): string {
  return 'Selecciona al menos un hotel.'
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
  return users.filter(user => user.role !== 'superadmin')
}

function filterRoleNames(roleNames: string[], isSuperadmin: boolean): string[] {
  if (isSuperadmin) return roleNames
  return roleNames.filter(role => role !== 'superadmin')
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
  return {
    name: user.name,
    document_number: user.document_number ?? '',
    phone: user.phone ?? '',
    email: user.email,
    password: '',
    role: user.role ?? 'receptionist',
    is_active: user.is_active,
    hotel_ids: user.hotel_ids ?? [],
  }
}

function toggleHotelAssignment(hotelIds: string[], hotelId: string, checked: boolean): string[] {
  if (checked) {
    return hotelIds.includes(hotelId) ? hotelIds : [...hotelIds, hotelId]
  }
  const next = hotelIds.filter(id => id !== hotelId)
  return next.length === 0 ? hotelIds : next
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
    name: form.name,
    document_number: form.document_number,
    phone: form.phone,
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
      email: generatePlaceholderEmail(form.name, form.role),
      password: generatePlaceholderPassword(),
    }
  }
  if (payload.role === 'superadmin') {
    return { ...payload, hotel_ids: [] }
  }
  return payload
}

interface UserHotelAssignmentProps {
  readonly role: string
  readonly hotelIds: string[]
  readonly assignableHotels: HotelSummary[]
  readonly onHotelIdsChange: (hotelIds: string[]) => void
}

function UserHotelAssignment({ role, hotelIds, assignableHotels, onHotelIdsChange }: UserHotelAssignmentProps) {
  if (!requiresHotelAssignment(role) || assignableHotels.length === 0) return null

  return (
    <fieldset className="border-0 p-0 m-0 min-w-0">
      <legend className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {hotelsAssignmentLabel()}
      </legend>
      <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
        {hotelsAssignmentHint()}
      </p>
      <div className="space-y-1 max-h-32 overflow-y-auto rounded-lg border px-2 py-2"
        style={{ borderColor: 'var(--border-default)' }}>
        {assignableHotels.map(hotel => {
          const checkboxId = `user-hotel-${hotel.id}`
          const checked = hotelIds.includes(hotel.id)
          const isLastSelected = checked && hotelIds.length === 1
          return (
            <label key={hotel.id} htmlFor={checkboxId} className="flex items-center gap-2 text-sm">
              <input
                id={checkboxId}
                type="checkbox"
                checked={checked}
                disabled={isLastSelected}
                onChange={e => onHotelIdsChange(toggleHotelAssignment(hotelIds, hotel.id, e.target.checked))}
              />
              <span style={{ color: 'var(--text-primary)' }}>{hotel.name}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface UserFormModalProps {
  readonly editing: AdminUser | null
  readonly form: UserForm
  readonly roleNames: string[]
  readonly assignableHotels: HotelSummary[]
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<UserForm>) => void
  readonly onHotelIdsChange: (hotelIds: string[]) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function UserFormModal({
  editing, form, roleNames, assignableHotels, saving, onClose, onChange, onHotelIdsChange, onSubmit,
}: UserFormModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)
  const needsLogin = roleNeedsLogin(form.role)

  return (
    <dialog
      ref={dialogRef}
      aria-label={userFormTitle(editing)}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <form
        onSubmit={onSubmit}
        autoComplete="off"
        className="relative z-10 pointer-events-auto rounded-xl p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {userFormTitle(editing)}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <input type="text" name="prevent-autofill" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
        <input type="password" name="prevent-autofill" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />

        <div>
          <label htmlFor={userFieldId('role')} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Rol
          </label>
          <select
            id={userFieldId('role')}
            value={form.role}
            onChange={e => {
              const role = e.target.value
              const patch: Partial<UserForm> = { role }
              if (role === 'superadmin') {
                patch.hotel_ids = []
              } else if (form.hotel_ids.length === 0 && assignableHotels.length === 1) {
                patch.hotel_ids = [assignableHotels[0].id]
              }
              onChange(patch)
            }}
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          >
            {roleNames.map(role => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
          {!needsLogin && (
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Este rol es solo para seguimiento interno y no tiene acceso al sistema.
            </p>
          )}
        </div>

        <UserHotelAssignment
          role={form.role}
          hotelIds={form.hotel_ids}
          assignableHotels={assignableHotels}
          onHotelIdsChange={onHotelIdsChange}
        />

        <div>
          <label htmlFor={userFieldId('name')} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Nombre
          </label>
          <input
            id={userFieldId('name')}
            type="text"
            value={form.name}
            required
            autoComplete="off"
            onChange={e => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={userFieldId('document_number')} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Cédula
            </label>
            <input
              id={userFieldId('document_number')}
              type="text"
              inputMode="numeric"
              value={form.document_number}
              autoComplete="off"
              onChange={e => onChange({ document_number: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
            />
          </div>
          <div>
            <label htmlFor={userFieldId('phone')} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Celular
            </label>
            <input
              id={userFieldId('phone')}
              type="tel"
              value={form.phone}
              autoComplete="off"
              onChange={e => onChange({ phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
            />
          </div>
        </div>

        {needsLogin && (
          <>
            <div>
              <label htmlFor={userFieldId('email')} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                id={userFieldId('email')}
                type="email"
                value={form.email}
                required
                autoComplete="off"
                name="user-email-field"
                onChange={e => onChange({ email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              />
            </div>
            <div>
              <label htmlFor={userFieldId('password')} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                {passwordFieldLabel(editing)}
              </label>
              <input
                id={userFieldId('password')}
                type="password"
                value={form.password}
                required={!editing}
                minLength={6}
                autoComplete="new-password"
                name="user-password-field"
                onChange={e => onChange({ password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              />
            </div>
          </>
        )}

        {editing && (
          <label htmlFor={userFieldId('is_active')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <input
              id={userFieldId('is_active')}
              type="checkbox"
              checked={form.is_active}
              onChange={e => onChange({ is_active: e.target.checked })}
            />
            <span>Activo</span>
          </label>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {userSaveLabel(saving)}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  )
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
  const assignableHotels = useHotelStore(s => s.hotels)

  const [form, setForm] = useState<UserForm>(EMPTY)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [open, setOpen] = useState(false)

  const isSuperadmin = hasRole('superadmin')
  const visibleUsers = filterVisibleUsers(users, isSuperadmin)
  const roleNames = filterRoleNames(roles.map(r => r.name), isSuperadmin)

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

  const deactivate = (user: AdminUser) => {
    if (confirm(`¿Desactivar a "${user.name}"?`)) remove.mutate(user.id)
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
            {visibleUsers.map(user => (
              <UserTableRow
                key={user.id}
                user={user}
                currentUserId={me?.id}
                isSuperadmin={isSuperadmin}
                onEdit={openEdit}
                onDeactivate={deactivate}
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
          onChange={patch => setForm(f => ({ ...f, ...patch }))}
          onHotelIdsChange={hotelIds => setForm(f => ({ ...f, hotel_ids: hotelIds }))}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
