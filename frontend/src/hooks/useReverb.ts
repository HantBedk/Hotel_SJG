import { useEffect, useRef } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

let echoInstance: Echo<'reverb'> | null = null

function getEcho(): Echo<'reverb'> | null {
  const isAuthenticated = useAuthStore.getState().isAuthenticated
  if (!isAuthenticated) return null

  if (!echoInstance) {
    echoInstance = new Echo({
      broadcaster:       'reverb',
      key:               import.meta.env.VITE_REVERB_APP_KEY ?? 'hotel_reverb_key',
      wsHost:            import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
      wsPort:            Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      wssPort:           Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      forceTLS:          (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      // Custom authorizer: routes broadcasting auth through our axios instance
      // so it inherits withCredentials + XSRF token (Sanctum SPA session).
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (err: Error | null, data: unknown) => void) => {
          api.post('/broadcasting/auth', {
            socket_id:    socketId,
            channel_name: channel.name,
          })
            .then((res) => callback(null, res.data))
            .catch((err) => callback(err as Error, null))
        },
      }),
    })
  }

  return echoInstance
}

export function disconnectEcho(): void {
  echoInstance?.disconnect()
  echoInstance = null
}

interface UseReverbOptions<T> {
  channel: string
  event: string
  onEvent: (data: T) => void
  enabled?: boolean
}

export function useReverb<T = unknown>({
  channel,
  event,
  onEvent,
  enabled = true,
}: UseReverbOptions<T>): void {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled) return

    const echo = getEcho()
    if (!echo) return

    const handler = (data: T) => onEventRef.current(data)
    const ch = echo.private(channel)
    ch.listen(event, handler)

    return () => {
      ch.stopListening(event, handler)
    }
  }, [channel, event, enabled])
}
