import type { DocumentType } from '@/types'

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'ti', label: 'Tarjeta de identidad' },
  { value: 'rc', label: 'Registro civil' },
]
