const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parsea fechas YYYY-MM-DD o ISO completas del API sin corromper el valor. */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null

  const trimmed = value.trim()

  // `new Date('YYYY-MM-DD')` es medianoche UTC → en CO (UTC-5) muestra el día anterior.
  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed)
  if (dateOnly) {
    const local = new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
      12,
      0,
      0,
    )
    return Number.isNaN(local.getTime()) ? null : local
  }

  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  if (trimmed.length >= 10) {
    const fallback = new Date(`${trimmed.slice(0, 10)}T12:00:00`)
    if (!Number.isNaN(fallback.getTime())) return fallback
  }

  return null
}

/**
 * Días calendario entre dos fechas de estadía (ignora hora).
 * Ej.: 2026-06-15 → 2026-06-18 = 3 noches.
 */
export function calendarNightsBetween(from: string, to: string): number {
  if (!from?.trim() || !to?.trim()) return 0
  const start = parseApiDate(from.slice(0, 10))
  const end = parseApiDate(to.slice(0, 10))
  if (!start || !end) return 0
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
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

export function formatDateTime(value: string | null | undefined): string {
  if (!value?.trim()) return '—'
  const parsed = new Date(value.trim())
  if (Number.isNaN(parsed.getTime())) return value.trim()
  return parsed.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}
