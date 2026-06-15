import api from '@/lib/axios'
import type { ApiResponse } from '@/types'
import type { Nationality } from '@/types/person'

export async function getNationalitiesApi(): Promise<Nationality[]> {
  const { data } = await api.get<ApiResponse<Nationality[]>>('/nationalities')
  return data.data
}
