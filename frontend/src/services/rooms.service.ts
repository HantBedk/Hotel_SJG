import api from '@/lib/axios'
import type { ApiResponse, Room, RoomType, RoomStatus } from '@/types'

export async function getRoomsApi(status?: RoomStatus): Promise<Room[]> {
  const params = status ? `?status=${status}` : ''
  const { data } = await api.get<ApiResponse<Room[]>>(`/rooms${params}`)
  return data.data
}

export async function getRoomApi(id: string): Promise<Room> {
  const { data } = await api.get<ApiResponse<Room>>(`/rooms/${id}`)
  return data.data
}

export async function createRoomApi(payload: {
  room_type_id: string
  number: string
  floor?: number | null
  notes?: string | null
}): Promise<Room> {
  const { data } = await api.post<ApiResponse<Room>>('/rooms', payload)
  return data.data
}

export async function updateRoomApi(id: string, payload: {
  room_type_id?: string
  number?: string
  floor?: number | null
  notes?: string | null
  is_active?: boolean
}): Promise<Room> {
  const { data } = await api.put<ApiResponse<Room>>(`/rooms/${id}`, payload)
  return data.data
}

export async function updateRoomStatusApi(id: string, payload: {
  status: RoomStatus
  notes?: string | null
}): Promise<Room> {
  const { data } = await api.patch<ApiResponse<Room>>(`/rooms/${id}/status`, payload)
  return data.data
}

export async function deleteRoomApi(id: string): Promise<void> {
  await api.delete(`/rooms/${id}`)
}

export async function getRoomTypesApi(): Promise<RoomType[]> {
  const { data } = await api.get<ApiResponse<RoomType[]>>('/room-types')
  return data.data
}
