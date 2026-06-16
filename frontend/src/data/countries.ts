export interface CountryOption {
  readonly code: string
  readonly name: string
}

export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'MX', name: 'México' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PE', name: 'Perú' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VE', name: 'Venezuela' },
] as const

export function countryLabel(code: string | null | undefined): string {
  if (!code) return '—'
  const match = COUNTRY_OPTIONS.find((c) => c.code === code.toUpperCase())
  if (match) return match.name
  return code
}
