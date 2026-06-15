export interface AdminPersona {
  id: string
  full_name: string
  primer_nombre: string
  segundo_nombre?: string | null
  primer_apellido: string
  segundo_apellido?: string | null
  document_type: string
  document_number: string
  email: string | null
  phone: string | null
  nationality_id?: string | null
  nationality_name: string | null
  birth_date?: string | null
  notes?: string | null
  roles: string[]
  hotel_ids: string[]
  hotel_names?: string[]
  has_login: boolean
  user_email: string | null
  user_active: boolean | null
  stays_count: number
}

export interface AdminPersonaPayload {
  primer_nombre: string
  segundo_nombre?: string
  primer_apellido: string
  segundo_apellido?: string
  document_type: string
  document_number: string
  email?: string | null
  phone?: string | null
  nationality_id?: string | null
  birth_date?: string | null
  notes?: string | null
  roles: string[]
  hotel_ids?: string[]
}

export interface AdminUser {
  id: string
  person_id?: string
  name: string
  primer_nombre?: string
  segundo_nombre?: string | null
  primer_apellido?: string
  segundo_apellido?: string | null
  document_number: string | null
  phone: string | null
  nationality_id?: string | null
  email: string
  is_active: boolean
  role: string | null
  hotel_ids?: string[]
  created_at: string
}

export interface AdminUserPayload {
  primer_nombre: string
  segundo_nombre?: string
  primer_apellido: string
  segundo_apellido?: string
  document_number?: string | null
  phone?: string | null
  nationality_id?: string | null
  email: string
  password?: string
  role: string
  is_active?: boolean
  hotel_ids?: string[]
  /** @deprecated compat */
  name?: string
}

export interface BackupFile {
  filename: string
  size: number
  created_at: string
}
