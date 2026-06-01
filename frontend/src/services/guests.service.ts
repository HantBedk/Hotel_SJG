import api from '@/lib/axios'
import type { Guest, GuestCompanion, Stay } from '@/types'

export const getGuestsApi = async (search?: string): Promise<{ data: Guest[]; meta: unknown }> => {
  const params = search ? { search } : {}
  const res = await api.get('/v1/guests', { params })
  return res.data.data
}

export const getGuestApi = async (id: string): Promise<Guest> => {
  const res = await api.get(`/v1/guests/${id}`)
  return res.data.data
}

export const createGuestApi = async (payload: {
  full_name: string
  document_type: string
  document_number: string
  email?: string
  phone?: string
  nationality?: string
  birth_date?: string
  notes?: string
  companions?: Partial<GuestCompanion>[]
}): Promise<Guest> => {
  const res = await api.post('/v1/guests', payload)
  return res.data.data
}

export const updateGuestApi = async (id: string, payload: Partial<Guest>): Promise<Guest> => {
  const res = await api.put(`/v1/guests/${id}`, payload)
  return res.data.data
}

export const deleteGuestApi = async (id: string): Promise<void> => {
  await api.delete(`/v1/guests/${id}`)
}

export const searchGuestsApi = async (term: string): Promise<Guest[]> => {
  const res = await api.get('/v1/guests', { params: { search: term } })
  return res.data.data.data ?? res.data.data
}

export const getGuestStaysApi = async (id: string): Promise<Stay[]> => {
  const res = await api.get(`/v1/guests/${id}/stays`)
  return res.data.data
}

export const findGuestByDocumentApi = async (document: string): Promise<Guest | null> => {
  const res = await api.get('/v1/guests', { params: { document: document.trim() } })
  const raw = res.data.data
  const guests: Guest[] = Array.isArray(raw) ? raw : (raw.data ?? [])
  return guests.length > 0 ? guests[0] : null
}
