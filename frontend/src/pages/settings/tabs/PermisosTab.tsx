import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useAdminRoles, useAdminPermissions, useRolePermissionMutations } from '@/hooks/useAdmin'
import { SkeletonText } from '@/components/ui/Skeleton'

type RolePerms = Record<string, Set<string>>

type AdminRole = {
  id: string
  name: string
  permissions: string[]
}

const PERMISSION_META: Record<string, { label: string; description: string }> = {
  view_dashboard: {
    label: 'Ver dashboard',
    description: 'Acceder al panel principal con KPIs y resumen del hotel.',
  },
  view_rooms: {
    label: 'Ver habitaciones',
    description: 'Consultar el estado y la información de las habitaciones.',
  },
  manage_rooms: {
    label: 'Gestionar habitaciones',
    description: 'Crear, editar y cambiar el estado de habitaciones (limpieza, mantenimiento, bloqueo).',
  },
  view_reservations: {
    label: 'Ver reservas',
    description: 'Consultar el listado y el detalle de reservas.',
  },
  manage_reservations: {
    label: 'Gestionar reservas',
    description: 'Crear, editar, cancelar y extender reservas.',
  },
  check_in: {
    label: 'Hacer check-in',
    description: 'Registrar la entrada de huéspedes (walk-in o desde reserva) y abrir estadías.',
  },
  check_out: {
    label: 'Hacer check-out',
    description: 'Procesar la salida de huéspedes y cerrar estadías.',
  },
  request_stay_void: {
    label: 'Solicitar anulación de estadía',
    description: 'Solicitar anulación por check-in erróneo; libera la habitación de inmediato.',
  },
  approve_stay_void: {
    label: 'Aprobar anulación de estadía',
    description: 'Revisar, aprobar o rechazar solicitudes de anulación de estadías.',
  },
  view_inventory: {
    label: 'Ver inventario',
    description: 'Consultar productos, stock, activos y órdenes de reparación.',
  },
  manage_inventory: {
    label: 'Gestionar inventario',
    description: 'Crear o editar productos, registrar entradas/salidas y manejar reparaciones.',
  },
  view_settings: {
    label: 'Ver configuración',
    description: 'Consultar la configuración del hotel sin poder editarla.',
  },
  manage_settings: {
    label: 'Gestionar configuración',
    description: 'Editar datos del hotel, tipos de habitación, casas, temporadas y servicios extra.',
  },
  view_activity_log: {
    label: 'Ver bitácora',
    description: 'Consultar el historial de acciones realizadas por los usuarios.',
  },
  manage_users: {
    label: 'Gestionar usuarios',
    description: 'Crear, editar y desactivar usuarios del sistema.',
  },
  manage_roles: {
    label: 'Gestionar roles y permisos',
    description: 'Modificar los permisos asociados a cada rol (esta misma pantalla).',
  },
  trigger_backup: {
    label: 'Generar respaldos',
    description: 'Crear copias de seguridad de la base de datos.',
  },
  restore_backup: {
    label: 'Restaurar respaldos',
    description: 'Restaurar la base de datos a partir de un respaldo previo.',
  },
  view_reports: {
    label: 'Ver reportes',
    description: 'Consultar reportes de ocupación, ingresos y desempeño.',
  },
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super administrador',
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  housekeeping: 'Camarera',
  maintenance: 'Mantenimiento',
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function permLabel(permission: string): string {
  return PERMISSION_META[permission]?.label ?? permission
}

function permDescription(permission: string): string {
  return PERMISSION_META[permission]?.description ?? permission
}

function saveAllLabel(saving: boolean): string {
  if (saving) return 'Guardando cambios…'
  return 'Guardar cambios'
}

function isSuperadminRole(name: string): boolean {
  return name === 'superadmin'
}

function rolesToLocalPerms(roles: AdminRole[]): RolePerms {
  const map: RolePerms = {}
  for (const role of roles) {
    map[role.id] = new Set(role.permissions)
  }
  return map
}

function filterEditableRoles(roles: AdminRole[]): AdminRole[] {
  return roles.filter(role => !isSuperadminRole(role.name))
}

function permissionCheckboxId(roleId: string, permission: string): string {
  return `perm-${roleId}-${permission}`
}

function permissionCheckboxLabel(roleName: string, permission: string): string {
  return `${permLabel(permission)} para ${roleLabel(roleName)}`
}

function togglePermissionInSet(permissions: Set<string>, permission: string): Set<string> {
  const next = new Set(permissions)
  if (next.has(permission)) {
    next.delete(permission)
  } else {
    next.add(permission)
  }
  return next
}

interface PermissionCheckboxCellProps {
  readonly role: AdminRole
  readonly permission: string
  readonly checked: boolean
  readonly onToggle: (roleId: string, permission: string) => void
}

function PermissionCheckboxCell({ role, permission, checked, onToggle }: PermissionCheckboxCellProps) {
  const checkboxId = permissionCheckboxId(role.id, permission)

  return (
    <td className="py-2 px-3 text-center">
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(role.id, permission)}
        aria-label={permissionCheckboxLabel(role.name, permission)}
        className="accent-blue-600 w-4 h-4 cursor-pointer"
        title={permDescription(permission)}
      />
    </td>
  )
}

interface PermissionRowProps {
  readonly permission: string
  readonly editableRoles: AdminRole[]
  readonly localPerms: RolePerms
  readonly onToggle: (roleId: string, permission: string) => void
}

function PermissionRow({ permission, editableRoles, localPerms, onToggle }: PermissionRowProps) {
  const description = permDescription(permission)

  return (
    <tr style={{ borderTop: '1px solid var(--border-default)' }}>
      <td
        className="py-2 pr-4 sticky left-0"
        style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}
        title={description}
      >
        <span className="cursor-help">{permLabel(permission)}</span>
        <span className="block font-mono" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          {permission}
        </span>
      </td>
      {editableRoles.map(role => (
        <PermissionCheckboxCell
          key={role.id}
          role={role}
          permission={permission}
          checked={localPerms[role.id]?.has(permission) ?? false}
          onToggle={onToggle}
        />
      ))}
    </tr>
  )
}

interface PermissionsTableProps {
  readonly permissions: string[]
  readonly editableRoles: AdminRole[]
  readonly localPerms: RolePerms
  readonly onToggle: (roleId: string, permission: string) => void
}

function PermissionsTable({ permissions, editableRoles, localPerms, onToggle }: PermissionsTableProps) {
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr>
          <th
            className="text-left py-2 pr-4 font-medium sticky left-0"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', minWidth: 220 }}
          >
            Permiso
          </th>
          {editableRoles.map(role => (
            <th
              key={role.id}
              className="text-center py-2 px-3 font-medium"
              style={{ color: 'var(--text-secondary)' }}
              title={role.name}
            >
              {roleLabel(role.name)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {permissions.map(permission => (
          <PermissionRow
            key={permission}
            permission={permission}
            editableRoles={editableRoles}
            localPerms={localPerms}
            onToggle={onToggle}
          />
        ))}
      </tbody>
    </table>
  )
}

interface SavePermissionsBarProps {
  readonly saving: boolean
  readonly onSave: () => void
}

function SavePermissionsBar({ saving, onSave }: SavePermissionsBarProps) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-primary)' }}
      >
        <Save size={13} />
        {saveAllLabel(saving)}
      </button>
    </div>
  )
}

export default function PermisosTab() {
  const { data: roles = [], isLoading: loadingRoles } = useAdminRoles()
  const { data: permissions = [], isLoading: loadingPerms } = useAdminPermissions()
  const { update } = useRolePermissionMutations()

  const [localPerms, setLocalPerms] = useState<RolePerms>({})
  const [savingAll, setSavingAll] = useState(false)

  useEffect(() => {
    if (roles.length > 0) {
      setLocalPerms(rolesToLocalPerms(roles))
    }
  }, [roles])

  const toggle = (roleId: string, permission: string) => {
    setLocalPerms(prev => ({
      ...prev,
      [roleId]: togglePermissionInSet(prev[roleId] ?? new Set(), permission),
    }))
  }

  const saveAll = async () => {
    const editableRoles = filterEditableRoles(roles)
    setSavingAll(true)
    try {
      await Promise.all(
        editableRoles.map(role =>
          update.mutateAsync({
            roleId: role.id,
            permissions: Array.from(localPerms[role.id] ?? []),
          }),
        ),
      )
    } finally {
      setSavingAll(false)
    }
  }

  if (loadingRoles || loadingPerms) return <SkeletonText lines={8} />

  const editableRoles = filterEditableRoles(roles)

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

      <PermissionsTable
        permissions={permissions}
        editableRoles={editableRoles}
        localPerms={localPerms}
        onToggle={toggle}
      />

      <SavePermissionsBar saving={savingAll} onSave={saveAll} />
    </div>
  )
}
