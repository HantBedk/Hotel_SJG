import { useState } from 'react'
import { Plus, Pencil, UserX } from 'lucide-react'
import { useAdminUsers, useAdminUserMutations, useAdminRoles } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'

type UserForm = { name: string; email: string; password: string; role: string; is_active: boolean }
const EMPTY: UserForm = { name: '', email: '', password: '', role: 'receptionist', is_active: true }

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
    setForm({ name: u.name, email: u.email, password: '', role: u.role ?? 'receptionist', is_active: u.is_active })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const payload: Partial<UserForm> = { name: form.name, email: form.email, role: form.role, is_active: form.is_active }
      if (form.password) payload.password = form.password
      await update.mutateAsync({ id: editing.id, data: payload })
    } else {
      await create.mutateAsync(form)
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
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td className="py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                  >
                    {u.role ?? '—'}
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
            className="rounded-xl p-6 space-y-4 w-full max-w-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing ? `Editar: ${editing.name}` : 'Nuevo usuario'}
            </h3>
            {(['name', 'email'] as const).map(k => (
              <div key={k}>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  {k === 'name' ? 'Nombre' : 'Email'}
                </label>
                <input
                  type={k === 'email' ? 'email' : 'text'}
                  value={form[k]}
                  required
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                {editing ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </label>
              <input
                type="password"
                value={form.password}
                required={!editing}
                minLength={6}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                {roleNames.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
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
