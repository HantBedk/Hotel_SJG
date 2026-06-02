export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}
