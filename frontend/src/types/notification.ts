export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  severity?: 'info' | 'warning' | 'critical'
  is_modal?: boolean
  payload: Record<string, unknown> | null
  action_url?: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}
