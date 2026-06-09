import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useAdminRoles, useAdminPermissions, useRolePermissionMutations } from '@/hooks/useAdmin'
import { SkeletonText } from '@/components/ui/Skeleton'

type RolePerms = Record<string, Set<string>>

// Etiquetas y descripciones en español por permiso. Si llega uno no mapeado,
// se muestra el nombre crudo (fallback) y no se rompe la UI.
const PERMISSION_META: Record<string, { label: string; description: string }> = {
  view_dashboard: {
    label:       'Ver dashboard',
    description: 'Acceder al panel principal con KPIs y resumen del hotel.',
  },
  view_rooms: {
    label:       'Ver habitaciones',
    description: 'Consultar el estado y la información de las habitaciones.',
  },
  manage_rooms: {
    label:       'Gestionar habitaciones',
    description: 'Crear, editar y cambiar el estado de habitaciones (limpieza, mantenimiento, bloqueo).',
  },
  view_reservations: {
    label:       'Ver reservas',
    description: 'Consultar el listado y el detalle de reservas.',
  },
  manage_reservations: {
    label:       'Gestionar reservas',
    description: 'Crear, editar, cancelar y extender reservas.',
  },
  check_in: {
    label:       'Hacer check-in',
    description: 'Registrar la entrada de huéspedes (walk-in o desde reserva) y abrir estadías.',
  },
  check_out: {
    label:       'Hacer check-out',
    description: 'Procesar la salida de huéspedes y cerrar estadías.',
  },
  view_inventory: {
    label:       'Ver inventario',
    description: 'Consultar productos, stock, activos y órdenes de reparación.',
  },
  manage_inventory: {
    label:       'Gestionar inventario',
    description: 'Crear o editar productos, registrar entradas/salidas y manejar reparaciones.',
  },
  view_settings: {
    label:       'Ver configuración',
    description: 'Consultar la configuración del hotel sin poder editarla.',
  },
  manage_settings: {
    label:       'Gestionar configuración',
    description: 'Editar datos del hotel, tipos de habitación, casas, temporadas y servicios extra.',
  },
  view_activity_log: {
    label:       'Ver bitácora',
    description: 'Consultar el historial de acciones realizadas por los usuarios.',
  },
  manage_users: {
    label:       'Gestionar usuarios',
    description: 'Crear, editar y desactivar usuarios del sistema.',
  },
  manage_roles: {
    label:       'Gestionar roles y permisos',
    description: 'Modificar los permisos asociados a cada rol (esta misma pantalla).',
  },
  trigger_backup: {
    label:       'Generar respaldos',
    description: 'Crear copias de seguridad de la base de datos.',
  },
  restore_backup: {
    label:       'Restaurar respaldos',
    description: 'Restaurar la base de datos a partir de un respaldo previo.',
  },
  view_reports: {
    label:       'Ver reportes',
    description: 'Consultar reportes de ocupación, ingresos y desempeño.',
  },
}

const ROLE_LABELS: Record<string, string> = {
  superadmin:   'Super administrador',
  admin:        'Administrador',
  receptionist: 'Recepcionista',
  housekeeping: 'Camarera',
  maintenance:  'Mantenimiento',
}
const roleLabel = (role: string) => ROLE_LABELS[role] ?? role

const permLabel       = (p: string) => PERMISSION_META[p]?.label       ?? p
const permDescription = (p: string) => PERMISSION_META[p]?.description ?? p

export default function PermisosTab() {
  const { data: roles = [], isLoading: loadingRoles }   = useAdminRoles()
  const { data: perms = [], isLoading: loadingPerms }   = useAdminPermissions()
  const { update }                                       = useRolePermissionMutations()

  const [localPerms, setLocalPerms] = useState<RolePerms>({})
  const [savingAll, setSavingAll]   = useState(false)

  useEffect(() => {
    if (roles.length) {
      const map: RolePerms = {}
      roles.forEach(r => { map[r.id] = new Set(r.permissions) })
      setLocalPerms(map)
    }
  }, [roles])

  const toggle = (roleId: string, perm: string, isSuperadmin: boolean) => {
    if (isSuperadmin) return
    setLocalPerms(prev => {
      const next = { ...prev, [roleId]: new Set(prev[roleId]) }
      if (next[roleId].has(perm)) next[roleId].delete(perm)
      else                        next[roleId].add(perm)
      return next
    })
  }

  if (loadingRoles || loadingPerms) return <SkeletonText lines={8} />

  const editableRoles = roles.filter(r => r.name !== 'superadmin')

  const saveAll = async () => {
    setSavingAll(true)
    try {
      await Promise.all(
        editableRoles.map(r =>
          update.mutateAsync({ roleId: r.id, permissions: Array.from(localPerms[r.id] ?? []) }),
        ),
      )
    } finally {
      setSavingAll(false)
    }
  }

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

      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Pasa el cursor sobre cada permiso para ver qué hace.
      </p>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-medium sticky left-0" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', minWidth: 220 }}>
              Permiso
            </th>
            {editableRoles.map(r => (
              <th
                key={r.id}
                className="text-center py-2 px-3 font-medium"
                style={{ color: 'var(--text-secondary)' }}
                title={r.name}
              >
                {roleLabel(r.name)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perms.map(perm => (
            <tr key={perm} style={{ borderTop: '1px solid var(--border-default)' }}>
              <td
                className="py-2 pr-4 sticky left-0"
                style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}
                title={permDescription(perm)}
              >
                <span className="cursor-help" title={permDescription(perm)}>
                  {permLabel(perm)}
                </span>
                <span
                  className="block font-mono"
                  style={{ color: 'var(--text-muted)', fontSize: 10 }}
                >
                  {perm}
                </span>
              </td>
              {editableRoles.map(r => (
                <td key={r.id} className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={localPerms[r.id]?.has(perm) ?? false}
                    onChange={() => toggle(r.id, perm, false)}
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                    title={permDescription(perm)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botón único: guarda los permisos de todos los roles editables */}
      <div className="flex justify-end pt-2">
        <button
          onClick={saveAll}
          disabled={savingAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-primary)' }}
        >
          <Save size={13} />
          {savingAll ? 'Guardando cambios…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
