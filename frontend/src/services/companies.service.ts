import api from '@/lib/axios'
import type { Company } from '@/types'

export interface CompanyFilters {
  search?: string
  page?: number
  per_page?: number
}

export const getCompaniesApi = async (
  filters?: string | CompanyFilters
): Promise<{ data: Company[]; meta: unknown }> => {
  const params = typeof filters === 'string'
    ? (filters ? { search: filters } : {})
    : (filters ?? {})
  const res = await api.get('/v1/companies', { params })
  return res.data.data
}

export const getCompanyApi = async (id: string): Promise<Company> => {
  const res = await api.get(`/v1/companies/${id}`)
  return res.data.data
}

export const createCompanyApi = async (payload: { name: string; nit: string; address?: string | null; phone?: string | null; email?: string | null; contact_name?: string | null; notes?: string | null }): Promise<Company> => {
  const res = await api.post('/v1/companies', payload)
  return res.data.data
}

export const updateCompanyApi = async (id: string, payload: Partial<Company>): Promise<Company> => {
  const res = await api.put(`/v1/companies/${id}`, payload)
  return res.data.data
}

export const deleteCompanyApi = async (id: string): Promise<void> => {
  await api.delete(`/v1/companies/${id}`)
}

export const searchCompaniesApi = async (term: string): Promise<Company[]> => {
  const res = await api.get('/v1/companies', { params: { search: term } })
  return res.data.data.data ?? res.data.data
}
