import axios from 'axios'
import api from '@/lib/axios'
import type { ApiResponse, LoginPayload, LoginResponse, AuthUser } from '@/types'

// Sanctum SPA mode: GET /sanctum/csrf-cookie sets the XSRF-TOKEN cookie.
// Uses a bare axios instance because it lives outside /api/v1.
export async function csrfCookieApi(): Promise<void> {
  await axios.get('/sanctum/csrf-cookie', {
    withCredentials: true,
    withXSRFToken: true,
  })
}

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
  await csrfCookieApi()
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
