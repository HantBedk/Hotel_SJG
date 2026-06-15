import api from '@/lib/axios'
import type { ApiResponse, Guest, GuestCompanion, Stay } from '@/types'

export interface GuestFilters {
  search?: string
  document?: string
  page?: number
  per_page?: number
}

export interface GuestsListResult {
  data: Guest[]
  meta: unknown
}

export interface CreateGuestPayload {
  full_name: string
  document_type: string
  document_number: string
  is_minor?: boolean
  relationship?: string
  email?: string
  phone?: string
  nationality?: string
  birth_date?: string
  notes?: string
  companions?: Partial<GuestCompanion>[]
}

function resolveGuestFilters(filters?: string | GuestFilters): GuestFilters {
  if (typeof filters === 'string') {
    if (!filters) return {}
    return { search: filters }
  }
  return filters ?? {}
}

function stripPayloadFields<T extends object>(
  payload: T,
  options: { readonly stripNull?: boolean } = {},
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === '' || value === undefined) return false
      if (options.stripNull && value === null) return false
      return true
    }),
  )
}

function extractGuestList(payload: GuestsListResult | Guest[]): Guest[] {
  if (Array.isArray(payload)) return payload
  return payload.data ?? []
}

export async function getGuestsApi(
  filters?: string | GuestFilters,
): Promise<GuestsListResult> {
  const { data } = await api.get<ApiResponse<GuestsListResult>>('/guests', {
    params: resolveGuestFilters(filters),
  })
  return data.data
}

export async function getGuestApi(id: string): Promise<Guest> {
  const { data } = await api.get<ApiResponse<Guest>>(`/guests/${id}`)
  return data.data
}

export async function createGuestApi(payload: CreateGuestPayload): Promise<Guest> {
  const { data } = await api.post<ApiResponse<Guest>>('/guests', stripPayloadFields(payload))
  return data.data
}

export async function updateGuestApi(id: string, payload: Partial<Guest>): Promise<Guest> {
  const { data } = await api.put<ApiResponse<Guest>>(`/guests/${id}`, stripPayloadFields(payload))
  return data.data
}

export async function deleteGuestApi(id: string): Promise<void> {
  await api.delete(`/guests/${id}`)
}

export async function searchGuestsApi(term: string): Promise<Guest[]> {
  const { data } = await api.get<ApiResponse<GuestsListResult | Guest[]>>('/guests', {
    params: { search: term },
  })
  return extractGuestList(data.data)
}

export async function getGuestStaysApi(id: string): Promise<Stay[]> {
  const { data } = await api.get<ApiResponse<Stay[]>>(`/guests/${id}/stays`)
  return data.data
}

export async function findGuestByDocumentApi(document: string): Promise<Guest | null> {
  const { data } = await api.get<ApiResponse<GuestsListResult | Guest[]>>('/guests', {
    params: { document: document.trim() },
  })
  const guests = extractGuestList(data.data)
  return guests.at(0) ?? null
}

export async function addCompanionApi(
  guestId: string,
  payload: Partial<GuestCompanion>,
): Promise<GuestCompanion> {
  const { data } = await api.post<ApiResponse<GuestCompanion>>(
    `/guests/${guestId}/companions`,
    stripPayloadFields(payload, { stripNull: true }),
  )
  return data.data
}
