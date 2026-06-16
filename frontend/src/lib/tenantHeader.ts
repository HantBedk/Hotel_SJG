/** Rutas de auth donde no debe enviarse X-Hotel-Id (evita 403 por tenant obsoleto en localStorage). */
export function shouldAttachHotelHeader(url: string | undefined): boolean {
  if (! url) return true

  const path = url.split('?')[0] ?? url

  return ! /\/(login|logout|me)$/.test(path)
}

export function isHotelAccessDeniedMessage(message: unknown): boolean {
  return typeof message === 'string' && message.includes('No tienes acceso a este hotel')
}
