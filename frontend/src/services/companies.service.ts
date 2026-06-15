import api from '@/lib/axios'
import type { ApiResponse, Company } from '@/types'

export interface CompanyFilters {
  search?: string
  page?: number
  per_page?: number
}

export interface CompaniesListResult {
  data: Company[]
  meta: unknown
}

export interface CreateCompanyPayload {
  name: string
  nit: string
  address?: string | null
  phone?: string | null
  email?: string | null
  contact_name?: string | null
  notes?: string | null
}

function resolveCompanyFilters(filters?: string | CompanyFilters): CompanyFilters {
  if (typeof filters === 'string') {
    if (!filters) return {}
    return { search: filters }
  }
  return filters ?? {}
}

function extractCompanyList(payload: CompaniesListResult | Company[]): Company[] {
  if (Array.isArray(payload)) return payload
  return payload.data
}

export async function getCompaniesApi(
  filters?: string | CompanyFilters,
): Promise<CompaniesListResult> {
  const { data } = await api.get<ApiResponse<CompaniesListResult>>('/companies', {
    params: resolveCompanyFilters(filters),
  })
  return data.data
}

export async function getCompanyApi(id: string): Promise<Company> {
  const { data } = await api.get<ApiResponse<Company>>(`/companies/${id}`)
  return data.data
}

export async function createCompanyApi(payload: CreateCompanyPayload): Promise<Company> {
  const { data } = await api.post<ApiResponse<Company>>('/companies', payload)
  return data.data
}

export async function updateCompanyApi(id: string, payload: Partial<Company>): Promise<Company> {
  const { data } = await api.put<ApiResponse<Company>>(`/companies/${id}`, payload)
  return data.data
}

export async function deleteCompanyApi(id: string): Promise<void> {
  await api.delete(`/companies/${id}`)
}

export async function searchCompaniesApi(term: string): Promise<Company[]> {
  const { data } = await api.get<ApiResponse<CompaniesListResult | Company[]>>('/companies', {
    params: { search: term },
  })
  return extractCompanyList(data.data)
}
