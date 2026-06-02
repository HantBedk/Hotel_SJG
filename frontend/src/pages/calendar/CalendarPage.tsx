import { useState, useCallback } from 'react'
import { addDays, addMonths, addWeeks, format, startOfWeek, subMonths, subWeeks, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import CalendarGrid from './components/CalendarGrid'
import NewReservationWizard from '@/pages/reservations/components/NewReservationWizard'
import type { CalendarEntry, CalendarData } from '@/types'
import { cn } from '@/lib/cn'

type ViewMode = 'week' | 'twoWeeks' | 'month'

const VIEW_DAYS: Record<ViewMode, number> = { week: 7, twoWeeks: 14, month: 30 }

// ── Mobile list view ──────────────────────────────────────────────────────────
function MobileCalendarList({ data, startDate, days }: { data: CalendarData; startDate: Date; days: number }) {
  const dates = eachDayOfInterval({ start: startDate, end: addDays(startDate, days - 1) })
  const allEntries = [...data.reservations, ...data.stays]

  return (
    <div className="space-y-3 pb-4">
      {dates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const entries = allEntries.filter((e) => {
          try {
            return isWithinInterval(date, {
              start: parseISO(e.start_date),
              end:   parseISO(e.end_date),
            })
          } catch { return false }
        })

        if (entries.length === 0) return null

        return (
          <div key={dateStr} className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="px-4 py-2 border-b font-semibold text-sm capitalize" style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)', background: 'var(--bg-input)' }}>
              {format(date, "EEEE d 'de' MMMM", { locale: es })}
            </div>
            <ul className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
              {entries.map((entry, i) => (
                <li key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className={cn(
                    'mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0',
                    entry.type === 'reservation'
                      ? (entry.status === 'confirmed' ? 'bg-sky-600' : 'bg-sky-400')
                      : (entry.status === 'extended'  ? 'bg-rose-700' : 'bg-rose-500'),
                  )} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.guest_name ?? entry.company_name ?? '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {entry.type === 'reservation' ? 'Reserva' : 'Estadía'} · Hab. {data.rooms.find(r => r.id === entry.room_id)?.number ?? '?'}
                      {' · '}{entry.start_date} → {entry.end_date}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {allEntries.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Sin eventos en este período.
        </p>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const [view, setView]           = useState<ViewMode>('week')
  const [anchor, setAnchor]       = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showWizard, setShowWizard] = useState(false)
  const [prefillDate, setPrefillDate] = useState<string | undefined>()
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null)

  const days     = VIEW_DAYS[view]
  const startStr = format(anchor, 'yyyy-MM-dd')
  const endStr   = format(addDays(anchor, days - 1), 'yyyy-MM-dd')

  const { data, isLoading, refetch } = useCalendar(startStr, endStr)

  const navigate = useCallback((dir: 'prev' | 'next') => {
    setAnchor(prev => {
      if (view === 'week')     return dir === 'next' ? addWeeks(prev, 1)  : subWeeks(prev, 1)
      if (view === 'twoWeeks') return dir === 'next' ? addWeeks(prev, 2)  : subWeeks(prev, 2)
      return dir === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    })
  }, [view])

  const goToday = () => {
    setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const handleCellClick = (roomId: string, date: Date) => {
    setPrefillDate(format(date, 'yyyy-MM-dd'))
    setShowWizard(true)
  }

  const rangeLabel = (() => {
    const end = addDays(anchor, days - 1)
    if (format(anchor, 'yyyy-MM') === format(end, 'yyyy-MM')) {
      return `${format(anchor, 'd', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`
    }
    return `${format(anchor, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`
  })()

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View mode — hidden on smallest screens */}
        <div
          className="hidden sm:flex rounded-lg overflow-hidden border text-sm"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {(['week', 'twoWeeks', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('px-3 py-1.5 transition-colors', view === v ? 'font-semibold' : '')}
              style={{
                background: view === v ? 'var(--color-primary)' : 'var(--bg-surface)',
                color: view === v ? 'white' : 'var(--text-secondary)',
              }}
            >
              {v === 'week' ? '7 días' : v === 'twoWeeks' ? '14 días' : '30 días'}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('prev')}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            Hoy
          </button>

          <button
            onClick={() => navigate('next')}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
          {rangeLabel}
        </span>

        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
          title="Actualizar"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={() => { setPrefillDate(undefined); setShowWizard(true) }}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          + Nueva reserva
        </button>
      </div>

      {/* Legend — hidden on mobile */}
      <div className="hidden sm:flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <LegendDot color="bg-sky-400" label="Reserva pendiente" />
        <LegendDot color="bg-sky-600" label="Reserva confirmada" />
        <LegendDot color="bg-rose-500" label="Estadía activa" />
        <LegendDot color="bg-rose-700" label="Estadía extendida" />
        <LegendDot color="bg-amber-400 opacity-50" label="Limpieza" />
        <LegendDot color="bg-orange-500 opacity-50" label="Mantenimiento" />
      </div>

      {/* Desktop grid */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {isLoading && !data ? (
          <div className="flex items-center justify-center h-40 text-sm w-full" style={{ color: 'var(--text-muted)' }}>
            Cargando...
          </div>
        ) : data ? (
          <CalendarGrid
            data={data}
            startDate={anchor}
            days={days}
            onEntryClick={setSelectedEntry}
            onCellClick={handleCellClick}
          />
        ) : null}
      </div>

      {/* Mobile list view */}
      <div className="md:hidden flex-1 overflow-y-auto">
        {isLoading && !data ? (
          <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--text-muted)' }}>
            Cargando...
          </div>
        ) : data ? (
          <MobileCalendarList data={data} startDate={anchor} days={days} />
        ) : null}
      </div>

      {/* Entry detail panel */}
      {selectedEntry && (
        <EntryDetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}

      {/* New reservation wizard */}
      {showWizard && (
        <NewReservationWizard
          prefillStartDate={prefillDate}
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

function EntryDetailPanel({ entry, onClose }: { entry: CalendarEntry; onClose: () => void }) {
  const isReservation = entry.type === 'reservation'

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-xl"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isReservation ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
            {isReservation ? 'Reserva' : 'Estadía'}
          </span>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>Cerrar</button>
        </div>

        <p className="font-semibold">{entry.guest_name ?? entry.company_name ?? '—'}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {entry.start_date} → {entry.end_date} · {entry.nights} noche(s)
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Estado: <span className="capitalize">{entry.status}</span>
        </p>
        {entry.agreed_price && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Precio: ${Number(entry.agreed_price).toLocaleString('es-CO')}
          </p>
        )}
      </div>
    </div>
  )
}
