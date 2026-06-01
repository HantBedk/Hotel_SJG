import api from '@/lib/axios'
import type { ApiResponse, DashboardStats } from '@/types'

export async function getDashboardApi(): Promise<DashboardStats> {
  const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard')
  return data.data
}
