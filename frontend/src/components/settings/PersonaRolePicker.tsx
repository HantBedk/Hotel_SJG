import { Check } from 'lucide-react'
import { personaRoleLabel, personaRoleStyle } from '@/lib/personaRoles'
import { cn } from '@/lib/cn'

const ROLE_HINTS: Record<string, string> = {
  guest: 'Huéspedes y estadías',
  receptionist: 'Recepción y reservas',
  housekeeping: 'Limpieza de habitaciones',
  maintenance: 'Mantenimiento operativo',
  admin: 'Configuración del hotel',
  superadmin: 'Acceso a todos los hoteles',
}

interface PersonaRolePickerProps {
  readonly roleOptions: string[]
  readonly selected: string[]
  readonly onChange: (roles: string[]) => void
}

function toggleInList(list: string[], role: string, checked: boolean): string[] {
  if (checked) return list.includes(role) ? list : [...list, role]
  const next = list.filter((r) => r !== role)
  return next.length === 0 ? list : next
}

export function PersonaRolePicker({ roleOptions, selected, onChange }: PersonaRolePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {roleOptions.map((role) => {
        const active = selected.includes(role)
        const style = personaRoleStyle(role)
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(toggleInList(selected, role, !active))}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
              active ? 'shadow-sm' : 'opacity-85 hover:opacity-100',
            )}
            style={{
              borderColor: active ? style.color : 'var(--border-default)',
              background: active ? style.background : 'var(--bg-base)',
              boxShadow: active ? `0 0 0 1px ${style.color}` : undefined,
            }}
            aria-pressed={active}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
              style={{ background: style.background, color: style.color }}
            >
              {active ? <Check size={14} strokeWidth={3} /> : personaRoleLabel(role).slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {personaRoleLabel(role)}
              </span>
              <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {ROLE_HINTS[role] ?? role}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
