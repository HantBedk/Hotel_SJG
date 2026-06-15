import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import type { Stay } from '@/types'
import { useHotelTimes } from '@/hooks/useHotelTimes'
import { busyConfirmLabel, formatDate, nextDayAtTime, toLocalDateTimeInput } from './utils'

interface StayExtendSectionProps {
  readonly stayId: string
  readonly stay: Stay
  readonly onExtend: (payload: { id: string; check_out_datetime: string }) => Promise<unknown>
}

export function StayExtendSection({ stayId, stay, onExtend }: StayExtendSectionProps) {
  const { checkOutTime } = useHotelTimes()
  const [showForm, setShowForm] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [isExtending, setIsExtending] = useState(false)

  const minExtendDate = toLocalDateTimeInput(stay.check_out_datetime)
  const isExtendDateValid =
    !!extendDate && new Date(extendDate).getTime() > new Date(stay.check_out_datetime).getTime()

  const openForm = () => {
    setExtendDate(nextDayAtTime(stay.check_out_datetime, checkOutTime))
    setShowForm(true)
  }

  const handleExtend = async () => {
    if (!isExtendDateValid) return
    setIsExtending(true)
    try {
      await onExtend({ id: stayId, check_out_datetime: extendDate })
      setShowForm(false)
      setExtendDate('')
    } finally {
      setIsExtending(false)
    }
  }

  if (stay.status !== 'active' && stay.status !== 'extended') return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarClock size={15} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Extender estadía</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openForm}
            className="text-xs px-2 py-1 rounded-lg border hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Extender
          </button>
        )}
      </div>
      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
        >
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Nueva fecha de salida{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                (debe ser posterior a {formatDate(stay.check_out_datetime)})
              </span>
            </p>
            <input
              type="datetime-local"
              value={extendDate}
              min={minExtendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExtend}
              disabled={!isExtendDateValid || isExtending}
              className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {busyConfirmLabel(isExtending)}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
