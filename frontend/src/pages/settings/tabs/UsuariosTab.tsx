import { useState } from 'react'
import { Plus, Pencil, UserX } from 'lucide-react'
import { useAdminUsers, useAdminUserMutations, useAdminRoles } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'

type UserForm = {
  name: string
  document_number: string
  phone: string
  email: string
  password: string
  role: string
  is_active: boolean
}
const EMPTY: UserForm = {
  name: '',
  document_number: '',
  phone: '',
  email: '',
  password: '',
  role: 'receptionist',
  is_active: true,
}

// Roles que acceden al sistema con email + contraseña.
const LOGIN_ROLES = new Set(['admin', 'superadmin', 'receptionist'])
const roleNeedsLogin = (role: string) => LOGIN_ROLES.has(role)

// Etiquetas en español para mostrar al usuario. El value que viaja al backend
// sigue siendo el nombre interno (admin, receptionist, etc.).
const ROLE_LABELS: Record<string, string> = {
  superadmin:   'Super administrador',
  admin:        'Administrador',
  receptionist: 'Recepcionista',
  housekeeping: 'Camarera',
  maintenance:  'Mantenimiento',
}
const roleLabel = (role: string | null | undefined) =>
  role ? (ROLE_LABELS[role] ?? role) : '—'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user'

// Email/contraseña ficticios para personal sin login. Único por timestamp+random.
function generatePlaceholderEmail(name: string, role: string) {
  const stamp = Date.now().toString(36)
  const rnd   = Math.random().toString(36).slice(2, 6)
  return `${slugify(role)}-${slugify(name)}-${stamp}${rnd}@personal.local`
}
function generatePlaceholderPassword() {
  // crypto.randomUUID retorna 36 chars (UUID con guiones), más que suficiente para el min:6 del backend.
  return globalThis.crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
}

export default function UsuariosTab() {
  const { data: users = [], isLoading } = useAdminUsers()
  const { create, update, remove }      = useAdminUserMutations()
  const { data: roles = [] }            = useAdminRoles()
  const { user: me }                    = useAuth()

  const [form, setForm]       = useState<UserForm>(EMPTY)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [open, setOpen]       = useState(false)

  const roleNames = roles.map(r => r.name).filter(r => r !== 'superadmin')

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (u: AdminUser) => {
    setEditing(u)
    setForm({
      name:            u.name,
      document_number: u.document_number ?? '',
      phone:           u.phone ?? '',
      email:           u.email,
      password:        '',
      role:            u.role ?? 'receptionist',
      is_active:       u.is_active,
    })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const needsLogin = roleNeedsLogin(form.role)

    if (editing) {
      const payload: Partial<UserForm> = {
        name:            form.name,
        document_number: form.document_number,
        phone:           form.phone,
        role:            form.role,
        is_active:       form.is_active,
      }
      if (needsLogin) {
        payload.email = form.email
        if (form.password) payload.password = form.password
      }
      // Si pasa de "login" a "personal", no tocamos email (placeholder lo asignaría el create).
      await update.mutateAsync({ id: editing.id, data: payload })
    } else {
      const payload: UserForm = needsLogin
        ? form
        : {
            ...form,
            email:    generatePlaceholderEmail(form.name, form.role),
            password: generatePlaceholderPassword(),
          }
      await create.mutateAsync(payload)
    }
    close()
  }

  const deactivate = (u: AdminUser) => {
    if (confirm(`¿Desactivar a "${u.name}"?`)) remove.mutate(u.id)
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Usuarios</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {isLoading ? <SkeletonText lines={4} /> : (
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
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td className="py-2" style={{ color: 'var(--text-primary)' }}>
                  {u.name}
                  {u.id === me?.id && (
                    <span className="ml-1 text-xs" style={{ color: 'var(--color-primary)' }}>(yo)</span>
                  )}
                </td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                  {u.email?.endsWith('@personal.local')
                    ? <span style={{ color: 'var(--text-muted)' }}>—</span>
                    : u.email}
                </td>
                <td className="py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                  >
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{ background: u.is_active ? '#D1FAE5' : '#FEE2E2', color: u.is_active ? '#065F46' : '#991B1B' }}
                  >
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(u)} style={{ color: 'var(--color-primary)' }}><Pencil size={13} /></button>
                    {u.id !== me?.id && u.role !== 'superadmin' && (
                      <button onClick={() => deactivate(u)} title="Desactivar" style={{ color: '#EF4444' }}>
                        <UserX size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <form
            onSubmit={submit}
            autoComplete="off"
            className="rounded-xl p-6 space-y-4 w-full max-w-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing ? `Editar: ${editing.name}` : 'Nuevo usuario'}
            </h3>

            {/* Trampa invisible para evitar que el navegador autocomplete email/contraseña en los campos reales */}
            <input type="text"     name="prevent-autofill" autoComplete="username"      className="hidden" tabIndex={-1} aria-hidden="true" />
            <input type="password" name="prevent-autofill" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />

            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                {roleNames.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              {!roleNeedsLogin(form.role) && (
                <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Este rol es solo para seguimiento interno y no tiene acceso al sistema.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nombre</label>
              <input
                type="text"
                value={form.name}
                required
                autoComplete="off"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Cédula</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.document_number}
                  autoComplete="off"
                  onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Celular</label>
                <input
                  type="tel"
                  value={form.phone}
                  autoComplete="off"
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                />
              </div>
            </div>

            {roleNeedsLogin(form.role) && (
              <>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    required
                    autoComplete="off"
                    name="user-email-field"
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {editing ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    required={!editing}
                    minLength={6}
                    autoComplete="new-password"
                    name="user-password-field"
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                  />
                </div>
              </>
            )}
            {editing && (
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                />
                Activo
              </label>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                {(create.isPending || update.isPending) ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={close} className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
