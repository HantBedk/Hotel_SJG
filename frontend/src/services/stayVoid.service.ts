import api from '@/lib/axios'
import type { StayVoidRequest, StayVoidRequestListResponse } from '@/types/stayVoid'

export const requestStayVoidApi = async (stayId: string, reason: string): Promise<StayVoidRequest> => {
  const res = await api.post(`/stays/${stayId}/void-request`, { reason })
  return res.data.data
}

export const getStayVoidRequestsApi = async (
  params?: { status?: string; page?: number; per_page?: number },
): Promise<StayVoidRequestListResponse> => {
  const res = await api.get('/stay-void-requests', { params: params ?? {} })
  return res.data.data
}

export const getStayVoidRequestApi = async (id: string): Promise<StayVoidRequest> => {
  const res = await api.get(`/stay-void-requests/${id}`)
  return res.data.data
}

export const approveStayVoidRequestApi = async (
  id: string,
  adminNotes?: string,
): Promise<StayVoidRequest> => {
  const res = await api.patch(`/stay-void-requests/${id}/approve`, {
    admin_notes: adminNotes ?? null,
  })
  return res.data.data
}

export const rejectStayVoidRequestApi = async (
  id: string,
  adminNotes?: string,
): Promise<StayVoidRequest> => {
  const res = await api.patch(`/stay-void-requests/${id}/reject`, {
    admin_notes: adminNotes ?? null,
  })
  return res.data.data
}
