import api from '@/lib/axios'
import type { ApiResponse, Room, RoomStatus, RoomType, Stay } from '@/types'

export interface CreateRoomPayload {
  room_type_id: string
  number: string
  floor?: number | null
  notes?: string | null
}

export interface UpdateRoomPayload {
  room_type_id?: string
  number?: string
  floor?: number | null
  notes?: string | null
  is_active?: boolean
}

export interface UpdateRoomStatusPayload {
  status: RoomStatus
  notes?: string | null
}

export interface Housekeeper {
  id: string
  name: string
}

export async function getRoomsApi(status?: RoomStatus): Promise<Room[]> {
  const { data } = await api.get<ApiResponse<Room[]>>('/rooms', {
    params: status ? { status } : undefined,
  })
  return data.data
}

export async function getRoomApi(id: string): Promise<Room> {
  const { data } = await api.get<ApiResponse<Room>>(`/rooms/${id}`)
  return data.data
}

export async function getRoomCurrentStayApi(id: string): Promise<Stay | null> {
  const { data } = await api.get<ApiResponse<Stay | null>>(`/rooms/${id}/current-stay`)
  return data.data
}

export async function createRoomApi(payload: CreateRoomPayload): Promise<Room> {
  const { data } = await api.post<ApiResponse<Room>>('/rooms', payload)
  return data.data
}

export async function updateRoomApi(id: string, payload: UpdateRoomPayload): Promise<Room> {
  const { data } = await api.put<ApiResponse<Room>>(`/rooms/${id}`, payload)
  return data.data
}

export async function updateRoomStatusApi(id: string, payload: UpdateRoomStatusPayload): Promise<Room> {
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

export async function getHousekeepersApi(): Promise<Housekeeper[]> {
  const { data } = await api.get<ApiResponse<Housekeeper[]>>('/housekeepers')
  return data.data
}
