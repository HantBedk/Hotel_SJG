export const PERSONA_ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  superadmin:   { label: 'Super administrador', bg: '#EDE9FE', color: '#5B21B6' },
  admin:        { label: 'Administrador',       bg: '#DBEAFE', color: '#1D4ED8' },
  receptionist: { label: 'Recepcionista',       bg: '#CCFBF1', color: '#0F766E' },
  housekeeping: { label: 'Camarera',            bg: '#FEF3C7', color: '#B45309' },
  maintenance:  { label: 'Mantenimiento',       bg: '#E2E8F0', color: '#475569' },
  guest:        { label: 'Huésped',             bg: '#F3F4F6', color: '#4B5563' },
}

export const PERSONA_ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'guest', label: 'Huésped' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'housekeeping', label: 'Camarera' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'admin', label: 'Administrador' },
  { value: 'superadmin', label: 'Super admin' },
] as const

export function personaRoleLabel(role: string): string {
  return PERSONA_ROLE_META[role]?.label ?? role
}

export function personaRoleStyle(role: string): { background: string; color: string } {
  const meta = PERSONA_ROLE_META[role]
  if (!meta) return { background: 'var(--bg-input)', color: 'var(--text-secondary)' }
  return { background: meta.bg, color: meta.color }
}

export function personaInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

export const DOC_LABELS: Record<string, string> = {
  cc: 'CC', ce: 'CE', passport: 'Pasaporte', ti: 'TI', rc: 'RC',
}
