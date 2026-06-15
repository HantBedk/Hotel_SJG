export interface AdminUser {
  id: string
  name: string
  document_number: string | null
  phone: string | null
  email: string
  is_active: boolean
  role: string | null
  hotel_ids?: string[]
  created_at: string
}

export interface AdminUserPayload {
  name: string
  document_number?: string | null
  phone?: string | null
  email: string
  password?: string
  role: string
  is_active?: boolean
  hotel_ids?: string[]
}

export interface BackupFile {
  filename: string
  size: number
  created_at: string
}
