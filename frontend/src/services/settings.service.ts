import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export type SettingsMap = Record<string, string>

export interface SettingEntry {
  key: string
  value: string
}

export async function getSettingsApi(group?: string): Promise<SettingsMap> {
  const { data } = await api.get<ApiResponse<SettingsMap>>('/settings', {
    params: group ? { group } : undefined,
  })
  return data.data
}

export async function updateSettingsApi(changes: SettingsMap): Promise<void> {
  const settings: SettingEntry[] = Object.entries(changes).map(([key, value]) => ({ key, value }))
  await api.put<ApiResponse>('/settings', { settings })
}
