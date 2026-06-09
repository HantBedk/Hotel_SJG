export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

// ── Date helpers (timezone-safe) ──────────────────────────────────────────────
// `new Date().toISOString().slice(0, 10)` devuelve la fecha en UTC, no en la
// zona local. En Bogotá (UTC-5), después de las 19:00 cae en el día siguiente,
// lo que provocaba que los check-ins de la noche guardaran `check_in_date` como
// "mañana" y el KPI de ingresos del dashboard los dejara fuera.

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Hoy como "YYYY-MM-DD" en la zona horaria del browser. */
export function todayLocalISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Ahora como "YYYY-MM-DDTHH:MM" en la zona horaria del browser. */
export function nowLocalISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Suma n días a una fecha "YYYY-MM-DD" devolviendo otra "YYYY-MM-DD" local. */
export function addDaysLocal(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  const result = new Date(y, m - 1, d)
  result.setDate(result.getDate() + n)
  return `${result.getFullYear()}-${pad2(result.getMonth() + 1)}-${pad2(result.getDate())}`
}
