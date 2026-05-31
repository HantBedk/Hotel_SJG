import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export type SettingsMap = Record<string, string>

export async function getSettingsApi(group?: string): Promise<SettingsMap> {
  const params = group ? `?group=${group}` : ''
  const { data } = await api.get<ApiResponse<SettingsMap>>(`/settings${params}`)
  return data.data
}

export async function updateSettingsApi(changes: SettingsMap): Promise<void> {
  const settings = Object.entries(changes).map(([key, value]) => ({ key, value }))
  await api.put('/settings', { settings })
}
