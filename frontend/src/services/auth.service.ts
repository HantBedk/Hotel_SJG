import api from '@/lib/axios'
import type { ApiResponse, LoginPayload, LoginResponse, AuthUser } from '@/types'

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/login', payload)
  return data
}

export async function logoutApi(): Promise<void> {
  await api.post('/logout')
}

export async function getMeApi(): Promise<ApiResponse<AuthUser>> {
  const { data } = await api.get<ApiResponse<AuthUser>>('/me')
  return data
}
