import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { hotelQueryKey } from '@/lib/hotelQueryKey'
import {
  approveStayVoidRequestApi,
  getStayVoidRequestApi,
  getStayVoidRequestsApi,
  rejectStayVoidRequestApi,
  requestStayVoidApi,
} from '@/services/stayVoid.service'

function invalidateVoidQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: hotelQueryKey('stay-void-requests') })
  queryClient.invalidateQueries({ queryKey: hotelQueryKey('stays') })
  queryClient.invalidateQueries({ queryKey: hotelQueryKey('rooms') })
  queryClient.invalidateQueries({ queryKey: hotelQueryKey('dashboard') })
  queryClient.invalidateQueries({ queryKey: hotelQueryKey('notifications') })
}

export function useStayVoidRequests(status = 'pending', listEnabled = true) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: hotelQueryKey('stay-void-requests', { status }),
    queryFn: () => getStayVoidRequestsApi({ status, per_page: 50 }),
    enabled: listEnabled,
  })

  const requestMutation = useMutation({
    mutationFn: ({ stayId, reason }: { stayId: string; reason: string }) =>
      requestStayVoidApi(stayId, reason),
    onSuccess: () => {
      toast.success('Solicitud enviada. La habitación quedó disponible.')
      invalidateVoidQueries(queryClient)
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'No se pudo solicitar la anulación.'),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: string; adminNotes?: string }) =>
      approveStayVoidRequestApi(id, adminNotes),
    onSuccess: () => {
      toast.success('Anulación aprobada.')
      invalidateVoidQueries(queryClient)
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'No se pudo aprobar la solicitud.'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: string; adminNotes?: string }) =>
      rejectStayVoidRequestApi(id, adminNotes),
    onSuccess: () => {
      toast.success('Solicitud rechazada.')
      invalidateVoidQueries(queryClient)
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'No se pudo rechazar la solicitud.'),
  })

  return {
    requests: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    isLoading,
    requestVoid: requestMutation.mutateAsync,
    isRequesting: requestMutation.isPending,
    approve: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    reject: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  }
}

export function useStayVoidRequest(id: string, enabled = true) {
  return useQuery({
    queryKey: hotelQueryKey('stay-void-requests', id),
    queryFn: () => getStayVoidRequestApi(id),
    enabled: enabled && !!id,
  })
}
