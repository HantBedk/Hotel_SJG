import type { Nationality, PersonNameFields } from './person'

export type { Nationality, PersonNameFields } from './person'

export type DocumentType = 'cc' | 'ce' | 'passport' | 'ti' | 'rc'

export interface Guest {
  id: string
  primer_nombre: string
  segundo_nombre: string | null
  primer_apellido: string
  segundo_apellido: string | null
  full_name: string
  document_type: DocumentType
  document_number: string
  is_minor: boolean
  relationship: string | null
  email: string | null
  phone: string | null
  nationality_id: string | null
  nationality?: Nationality | null
  birth_date: string | null
  notes: string | null
  stays_count?: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type GuestNameInput = PersonNameFields
