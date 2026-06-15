export interface Nationality {
  id: string
  name: string
  iso_code: string | null
  is_active?: boolean
  sort_order?: number
}

export interface PersonNameFields {
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
}

export const emptyPersonName = (): PersonNameFields => ({
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
})

export function isPersonNameValid(name: PersonNameFields): boolean {
  return name.primer_nombre.trim() !== '' && name.primer_apellido.trim() !== ''
}

export function personNameFromGuest(guest: {
  primer_nombre?: string
  segundo_nombre?: string | null
  primer_apellido?: string
  segundo_apellido?: string | null
  full_name?: string
}): PersonNameFields {
  if (guest.primer_nombre || guest.primer_apellido) {
    return {
      primer_nombre: guest.primer_nombre ?? '',
      segundo_nombre: guest.segundo_nombre ?? '',
      primer_apellido: guest.primer_apellido ?? '',
      segundo_apellido: guest.segundo_apellido ?? '',
    }
  }
  const parts = (guest.full_name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return emptyPersonName()
  if (parts.length === 1) {
    return { primer_nombre: parts[0], segundo_nombre: '', primer_apellido: '', segundo_apellido: '' }
  }
  if (parts.length === 2) {
    return { primer_nombre: parts[0], segundo_nombre: '', primer_apellido: parts[1], segundo_apellido: '' }
  }
  if (parts.length === 3) {
    return { primer_nombre: parts[0], segundo_nombre: '', primer_apellido: parts[1], segundo_apellido: parts[2] }
  }
  return {
    primer_nombre: parts[0],
    segundo_nombre: parts[1],
    primer_apellido: parts.at(-2) ?? '',
    segundo_apellido: parts.at(-1) ?? '',
  }
}
