export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message: string
  errors: Record<string, string[]>
}
