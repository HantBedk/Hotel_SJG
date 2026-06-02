import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useAdminRoles, useAdminPermissions, useRolePermissionMutations } from '@/hooks/useAdmin'
import { SkeletonText } from '@/components/ui/Skeleton'

type RolePerms = Record<number, Set<string>>

export default function PermisosTab() {
  const { data: roles = [], isLoading: loadingRoles }   = useAdminRoles()
  const { data: perms = [], isLoading: loadingPerms }   = useAdminPermissions()
  const { update }                                       = useRolePermissionMutations()

  const [localPerms, setLocalPerms] = useState<RolePerms>({})
  const [saving, setSaving]         = useState<number | null>(null)

  useEffect(() => {
    if (roles.length) {
      const map: RolePerms = {}
      roles.forEach(r => { map[r.id] = new Set(r.permissions) })
      setLocalPerms(map)
    }
  }, [roles])

  const toggle = (roleId: number, perm: string, isSuperadmin: boolean) => {
    if (isSuperadmin) return
    setLocalPerms(prev => {
      const next = { ...prev, [roleId]: new Set(prev[roleId]) }
      if (next[roleId].has(perm)) next[roleId].delete(perm)
      else                        next[roleId].add(perm)
      return next
    })
  }

  const save = async (roleId: number) => {
    setSaving(roleId)
    await update.mutateAsync({ roleId, permissions: Array.from(localPerms[roleId] ?? []) })
    setSaving(null)
  }

  if (loadingRoles || loadingPerms) return <SkeletonText lines={8} />

  const editableRoles = roles.filter(r => r.name !== 'superadmin')

  return (
    <div
      className="rounded-xl p-5 space-y-4 overflow-x-auto"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        Permisos por rol
      </h2>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Superadmin tiene todos los permisos y no se puede modificar.
      </p>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-medium sticky left-0" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', minWidth: 170 }}>
              Permiso
            </th>
            {editableRoles.map(r => (
              <th key={r.id} className="text-center py-2 px-3 font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perms.map(perm => (
            <tr key={perm} style={{ borderTop: '1px solid var(--border-default)' }}>
              <td
                className="py-2 pr-4 font-mono sticky left-0"
                style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)', fontSize: 11 }}
              >
                {perm}
              </td>
              {editableRoles.map(r => (
                <td key={r.id} className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={localPerms[r.id]?.has(perm) ?? false}
                    onChange={() => toggle(r.id, perm, false)}
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Save buttons per role */}
      <div className="flex gap-3 flex-wrap pt-2">
        {editableRoles.map(r => (
          <button
            key={r.id}
            onClick={() => save(r.id)}
            disabled={saving === r.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Save size={12} />
            {saving === r.id ? 'Guardando…' : `Guardar ${r.name}`}
          </button>
        ))}
      </div>
    </div>
  )
}
