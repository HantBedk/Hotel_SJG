export type DocumentType = 'cc' | 'ce' | 'passport' | 'ti' | 'rc'

export interface GuestCompanion {
  id: string
  guest_id: string
  name: string
  document_type: DocumentType | null
  document_number: string | null
  relationship: string | null
  age: number | null
}

export interface Guest {
  id: string
  full_name: string
  document_type: DocumentType
  document_number: string
  is_minor: boolean
  relationship: string | null
  email: string | null
  phone: string | null
  nationality: string | null
  birth_date: string | null
  notes: string | null
  companions?: GuestCompanion[]
  stays_count?: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}
