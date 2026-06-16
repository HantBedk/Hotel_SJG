export function emptyGuestsMessage(search: string): string {
  if (search.trim().length >= 2) {
    return 'Prueba con otro término de búsqueda o revisa la ortografía del documento.'
  }
  return 'Registra huéspedes para agilizar check-in, reservas y facturación.'
}

export function staysCountLabel(count: number): string {
  if (count === 0) return 'Sin estadías'
  if (count === 1) return '1 estadía'
  return `${count} estadías`
}

export function staysBadgeStyle(count: number): { background: string; color: string } {
  if (count > 0) return { background: '#DCFCE7', color: '#166534' }
  return { background: 'var(--bg-input)', color: 'var(--text-muted)' }
}
