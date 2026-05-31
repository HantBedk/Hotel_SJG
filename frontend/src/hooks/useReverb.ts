import { useEffect, useRef } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useAuthStore } from '@/store/authStore'

// Pusher global required by laravel-echo
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

let echoInstance: Echo | null = null

function getEcho(): Echo | null {
  const token = useAuthStore.getState().token
  if (!token) return null

  if (!echoInstance) {
    echoInstance = new Echo({
      broadcaster:   'reverb',
      key:           import.meta.env.VITE_REVERB_APP_KEY ?? 'hotel_reverb_key',
      wsHost:        import.meta.env.VITE_REVERB_HOST ?? 'localhost',
      wsPort:        Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      wssPort:       Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      forceTLS:      (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint:  '/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
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

    const ch = echo.private(channel)
    ch.listen(event, (data: T) => onEventRef.current(data))

    return () => {
      ch.stopListening(event)
    }
  }, [channel, event, enabled])
}
