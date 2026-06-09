import api from '@/lib/axios'
import type { ApiResponse, DashboardStats } from '@/types'

export async function getDashboardApi(): Promise<DashboardStats> {
  const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard')
  return data.data
}

export interface OccupancyPoint { label: string; occupied: number; rate: number }
export interface OccupancyHistory { period: string; data: OccupancyPoint[] }

export async function getOccupancyHistoryApi(period: 'weekly' | 'monthly'): Promise<OccupancyHistory> {
  const { data } = await api.get<ApiResponse<OccupancyHistory>>('/dashboard/occupancy-history', { params: { period } })
  return data.data
}
