import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getCompaniesApi, createCompanyApi, updateCompanyApi, deleteCompanyApi, searchCompaniesApi,
} from '@/services/companies.service'
import { extractApiError } from '@/lib/apiError'
import type { Company } from '@/types'

export function useCompanies(search?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn:  () => getCompaniesApi(search),
  })

  const createMutation = useMutation({
    mutationFn: createCompanyApi,
    onSuccess: () => {
      toast.success('Empresa creada.')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al crear empresa.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Company> }) =>
      updateCompanyApi(id, payload),
    onSuccess: () => {
      toast.success('Empresa actualizada.')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al actualizar empresa.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyApi,
    onSuccess: () => {
      toast.success('Empresa eliminada.')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, 'Error al eliminar empresa.')),
  })

  return {
    companies:     (data as { data: Company[] })?.data ?? [],
    isLoading,
    createCompany: createMutation.mutate,
    updateCompany: updateMutation.mutate,
    deleteCompany: deleteMutation.mutate,
    isCreating:    createMutation.isPending,
    isUpdating:    updateMutation.isPending,
    isDeleting:    deleteMutation.isPending,
  }
}

export function useCompanySearch(term: string, enabled = true) {
  return useQuery({
    queryKey: ['companies', 'search', term],
    queryFn:  () => searchCompaniesApi(term),
    enabled:  enabled && term.length >= 2,
    staleTime: 10_000,
  })
}
