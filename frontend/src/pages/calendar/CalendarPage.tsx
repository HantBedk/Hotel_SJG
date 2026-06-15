import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, addMonths, addWeeks, addYears, format, startOfWeek, startOfYear, endOfMonth, subMonths, subWeeks, subYears, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink, LogIn, XCircle as XCircleIcon } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import CalendarGrid from './components/CalendarGrid'
import NewReservationWizard from '@/pages/reservations/components/NewReservationWizard'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import type { CalendarEntry, CalendarData } from '@/types'
import { cn } from '@/lib/cn'

type ViewMode = 'week' | 'twoWeeks' | 'month' | 'year'

const VIEW_DAYS: Record<ViewMode, number> = { week: 7, twoWeeks: 14, month: 30, year: 365 }

const MOBILE_SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => `calendar-skeleton-${i + 1}`)

function occupancyHeatColor(pct: number): string {
  if (pct >= 0.9) return '#7F1D1D'
  if (pct >= 0.7) return '#DC2626'
  if (pct >= 0.5) return '#F97316'
  if (pct >= 0.3) return '#F59E0B'
  if (pct > 0) return '#10B981'
  return 'var(--bg-input)'
}

function entryDotClass(entry: CalendarEntry): string {
  if (entry.type === 'reservation') {
    return entry.status === 'confirmed' ? 'bg-sky-600' : 'bg-sky-400'
  }
  return entry.status === 'extended' ? 'bg-rose-700' : 'bg-rose-500'
}

function viewModeLabel(mode: ViewMode): string {
  if (mode === 'week') return '7 días'
  if (mode === 'twoWeeks') return '14 días'
  if (mode === 'month') return '30 días'
  return 'Año'
}

function monthAverageOccupancy(monthTotalOccupied: number, daysCount: number, totalRooms: number): number {
  if (totalRooms === 0) return 0
  return Math.round((monthTotalOccupied / (daysCount * totalRooms)) * 100)
}

interface HeatmapDayCellProps {
  readonly date: Date
  readonly occ: number
  readonly totalRooms: number
  readonly today: string
}

function HeatmapDayCell({ date, occ, totalRooms, today }: HeatmapDayCellProps) {
  const pct = totalRooms > 0 ? occ / totalRooms : 0
  const isToday = format(date, 'yyyy-MM-dd') === today
  return (
    <div
      className="aspect-square rounded-sm"
      style={{
        background: occupancyHeatColor(pct),
        outline: isToday ? '1.5px solid var(--color-primary)' : 'none',
        outlineOffset: '1px',
      }}
      title={`${format(date, 'd MMM', { locale: es })} · ${occ}/${totalRooms} (${Math.round(pct * 100)}%)`}
    />
  )
}

interface YearHeatmapProps {
  readonly data: CalendarData
  readonly startDate: Date
  readonly onMonthClick?: (monthStart: Date) => void
}

interface MobileCalendarListProps {
  readonly data: CalendarData
  readonly startDate: Date
  readonly days: number
}

interface LegendDotProps {
  readonly color: string
  readonly label: string
}

interface EntryDetailPanelProps {
  readonly entry: CalendarEntry
  readonly onClose: () => void
}

// ── Year heatmap: 12 mini-meses con celdas por día coloreadas por ocupación ──
function YearHeatmap({ data, startDate, onMonthClick }: YearHeatmapProps) {
  const totalRooms = data.rooms.length
  const entries = [...data.reservations, ...data.stays]

  const occupiedSet = (date: Date): Set<string> => {
    const occupied = new Set<string>()
    for (const e of entries) {
      try {
        if (e.room_id && isWithinInterval(date, { start: parseISO(e.start_date), end: parseISO(e.end_date) })) {
          occupied.add(e.room_id)
        }
      } catch { /* skip */ }
    }
    return occupied
  }

  const months = Array.from({ length: 12 }).map((_, i) => addMonths(startDate, i))
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart)
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
        let monthTotalOccupied = 0
        return (
          <button
            type="button"
            key={format(monthStart, 'yyyy-MM')}
            onClick={() => onMonthClick?.(monthStart)}
            className="rounded-xl border p-3 text-left transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            title={`Ver ${format(monthStart, 'MMMM yyyy', { locale: es })} en vista de 30 días`}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-2 capitalize"
              style={{ color: 'var(--text-secondary)' }}>
              {format(monthStart, 'MMMM yyyy', { locale: es })}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((date) => {
                const occ = occupiedSet(date).size
                monthTotalOccupied += occ
                return (
                  <HeatmapDayCell
                    key={format(date, 'yyyy-MM-dd')}
                    date={date}
                    occ={occ}
                    totalRooms={totalRooms}
                    today={today}
                  />
                )
              })}
            </div>
            <div className="text-[10px] mt-2 text-right" style={{ color: 'var(--text-muted)' }}>
              Prom. {monthAverageOccupancy(monthTotalOccupied, days.length, totalRooms)}%
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Mobile list view ──────────────────────────────────────────────────────────
function MobileCalendarList({ data, startDate, days }: MobileCalendarListProps) {
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
              {entries.map((entry) => (
                <li key={`${entry.type}-${entry.id}`} className="px-4 py-3 flex items-start gap-3">
                  <span className={cn('mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0', entryDotClass(entry))} />
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
      if (view === 'year')     return dir === 'next' ? addYears(prev, 1)  : subYears(prev, 1)
      return dir === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    })
  }, [view])

  const goToday = () => {
    if (view === 'year') setAnchor(startOfYear(new Date()))
    else setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const switchView = (v: ViewMode) => {
    setView(v)
    if (v === 'year') setAnchor(startOfYear(anchor))
    else if (view === 'year') setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const handleCellClick = (_roomId: string, date: Date) => {
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

  let desktopContent: React.ReactNode = null
  if (isLoading && !data) {
    desktopContent = (
      <div className="flex-1 p-4">
        <SkeletonTable rows={8} cols={7} />
      </div>
    )
  } else if (data && view === 'year') {
    desktopContent = (
      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        <YearHeatmap
          data={data}
          startDate={anchor}
          onMonthClick={(monthStart) => {
            setView('month')
            setAnchor(monthStart)
          }}
        />
      </div>
    )
  } else if (data) {
    desktopContent = (
      <CalendarGrid
        data={data}
        startDate={anchor}
        days={days}
        onEntryClick={setSelectedEntry}
        onCellClick={handleCellClick}
        onRangeSelect={(_roomId, start, _end) => {
          setPrefillDate(format(start, 'yyyy-MM-dd'))
          setShowWizard(true)
        }}
      />
    )
  }

  let mobileContent: React.ReactNode = null
  if (isLoading && !data) {
    mobileContent = (
      <div className="p-4 space-y-2">
        {MOBILE_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  } else if (data) {
    mobileContent = <MobileCalendarList data={data} startDate={anchor} days={days} />
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View mode — hidden on smallest screens */}
        <div
          className="hidden sm:flex rounded-lg overflow-hidden border text-sm"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {(['week', 'twoWeeks', 'month', 'year'] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => switchView(v)}
              className={cn('px-3 py-1.5 transition-colors', view === v ? 'font-semibold' : '')}
              style={{
                background: view === v ? 'var(--color-primary)' : 'var(--bg-surface)',
                color: view === v ? 'white' : 'var(--text-secondary)',
              }}
            >
              {viewModeLabel(v)}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('prev')}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            Hoy
          </button>

          <button
            type="button"
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
          type="button"
          onClick={() => refetch()}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
          title="Actualizar"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
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
        {desktopContent}
      </div>

      {/* Mobile list view */}
      <div className="md:hidden flex-1 overflow-y-auto">
        {mobileContent}
      </div>

      {/* Entry detail panel */}
      {selectedEntry && (
        <EntryDetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
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

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

function EntryDetailPanel({ entry, onClose }: EntryDetailPanelProps) {
  const isReservation = entry.type === 'reservation'
  const navigate = useNavigate()
  const canCheckIn = isReservation && ['pending', 'confirmed'].includes(entry.status)

  const go = (path: string) => { onClose(); navigate(path) }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Cerrar panel"
        className="absolute inset-0 border-0 p-0 cursor-default"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-xl"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isReservation ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
            {isReservation ? 'Reserva' : 'Estadía'}
          </span>
          <button type="button" onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>Cerrar</button>
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

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
          {isReservation ? (
            <>
              <button
                type="button"
                onClick={() => go(`/reservations?id=${entry.id}`)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                <ExternalLink size={13} /> Ver reserva
              </button>
              {canCheckIn && (
                <button
                  type="button"
                  onClick={() => go(`/reservations?id=${entry.id}&action=checkin`)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  <LogIn size={13} /> Check-in
                </button>
              )}
              {canCheckIn && (
                <button
                  type="button"
                  onClick={() => go(`/reservations?id=${entry.id}&action=cancel`)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border"
                  style={{ borderColor: 'var(--border-default)', color: '#DC2626' }}
                >
                  <XCircleIcon size={13} /> Cancelar
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => go(`/stays?id=${entry.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              <ExternalLink size={13} /> Ver estadía
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
