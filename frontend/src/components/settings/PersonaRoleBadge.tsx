import { personaRoleLabel, personaRoleStyle } from '@/lib/personaRoles'

interface PersonaRoleBadgeProps {
  readonly role: string
  readonly compact?: boolean
}

export function PersonaRoleBadge({ role, compact = false }: PersonaRoleBadgeProps) {
  return (
    <span
      className={`inline-block rounded font-medium ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
      style={personaRoleStyle(role)}
    >
      {personaRoleLabel(role)}
    </span>
  )
}

interface PersonaRoleBadgeListProps {
  readonly roles: string[]
  readonly compact?: boolean
}

export function PersonaRoleBadgeList({ roles, compact }: PersonaRoleBadgeListProps) {
  if (roles.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin rol</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <PersonaRoleBadge key={role} role={role} compact={compact} />
      ))}
    </div>
  )
}
