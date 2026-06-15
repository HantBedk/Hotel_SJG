import api from '@/lib/axios'
import type { ApiResponse, AuthUser, LoginPayload, LoginResponse } from '@/types'

async function ensureCsrfCookie(): Promise<void> {
  await api.get('/sanctum/csrf-cookie', { baseURL: '/' })
}

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
  await ensureCsrfCookie()
  const { data } = await api.post<ApiResponse<LoginResponse>>('/login', payload)
  return data
}

export async function logoutApi(): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>('/logout')
  return data
}

export async function getMeApi(): Promise<ApiResponse<AuthUser>> {
  const { data } = await api.get<ApiResponse<AuthUser>>('/me')
  return data
}

export async function forgotPasswordApi(email: string): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>('/forgot-password', { email })
  return data
}
