/** Parsea fechas YYYY-MM-DD o ISO completas del API sin corromper el valor. */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null

  const trimmed = value.trim()
  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  if (trimmed.length >= 10) {
    const fallback = new Date(`${trimmed.slice(0, 10)}T12:00:00`)
    if (!Number.isNaN(fallback.getTime())) return fallback
  }

  return null
}

export function formatDateShort(value: string | null | undefined): string {
  const parsed = parseApiDate(value)
  if (!parsed) return value?.trim() || '—'
  return parsed.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function formatDateMedium(value: string | null | undefined): string {
  const parsed = parseApiDate(value)
  if (!parsed) return value?.trim() || '—'
  return parsed.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDateShort(start)} → ${formatDateShort(end)}`
}
