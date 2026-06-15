export const STAFF_ROLES = ['admin', 'receptionist', 'housekeeping', 'maintenance'] as const
export const LOGIN_ROLES = ['admin', 'superadmin', 'receptionist'] as const

const PERSONAL_LOCAL_SUFFIX = '@personal.local'

export function rolesRequireHotelAssignment(roles: string[]): boolean {
  if (roles.includes('superadmin')) return false
  return roles.some((role) => (STAFF_ROLES as readonly string[]).includes(role))
}

/** Roles de personal exigen correo real (lo define admin/superadmin). */
export function rolesRequireStaffEmail(roles: string[]): boolean {
  return rolesRequireHotelAssignment(roles)
}

export function rolesRequireLoginEmail(roles: string[]): boolean {
  return roles.some((role) => (LOGIN_ROLES as readonly string[]).includes(role))
}

export function isRealStaffEmail(email: string): boolean {
  const trimmed = email.trim()
  if (!trimmed) return false
  return !trimmed.toLowerCase().endsWith(PERSONAL_LOCAL_SUFFIX)
}

export function hasValidHotelAssignment(
  roles: string[],
  hotelIds: string[],
  assignableCount: number,
): boolean {
  if (!rolesRequireHotelAssignment(roles) || assignableCount === 0) return true
  return hotelIds.length >= 1
}
