export interface Company {
  id: string
  name: string
  nit: string
  address: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
