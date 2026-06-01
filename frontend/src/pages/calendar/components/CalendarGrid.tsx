import { useMemo } from 'react'
import { addDays, format, isToday, parseISO, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CalendarData, CalendarEntry, CalendarRoom } from '@/types'

interface Props {
  data: CalendarData
  startDate: Date
  days: number
  onEntryClick?: (entry: CalendarEntry) => void
  onCellClick?: (roomId: string, date: Date) => void
}

function entryColor(entry: CalendarEntry): string {
  if (entry.type === 'reservation') {
    return entry.status === 'confirmed'
      ? 'bg-sky-600 text-white'
      : 'bg-sky-400/80 text-white'
  }
  return entry.status === 'extended' ? 'bg-rose-700 text-white' : 'bg-rose-500 text-white'
}

function roomStatusColor(status: string): string {
  switch (status) {
    case 'cleaning':     return 'bg-amber-400'
    case 'maintenance':  return 'bg-orange-500'
    case 'blocked':      return 'bg-slate-500'
    default:             return ''
  }
}

export default function CalendarGrid({ data, startDate, days, onEntryClick, onCellClick }: Props) {
  const dates = useMemo(
    () => eachDayOfInterval({ start: startDate, end: addDays(startDate, days - 1) }),
    [startDate, days]
  )

  // Build a map: roomId → date-string → entry[]
  const entryMap = useMemo(() => {
    const map: Record<string, Record<string, CalendarEntry[]>> = {}

    const allEntries = [...data.reservations, ...data.stays]

    for (const entry of allEntries) {
      if (!entry.room_id) continue

      const entryStart = parseISO(entry.start_date)
      const entryEnd   = parseISO(entry.end_date)

      for (const date of dates) {
        if (date >= entryStart && date < entryEnd) {
          const key = format(date, 'yyyy-MM-dd')
          if (!map[entry.room_id]) map[entry.room_id] = {}
          if (!map[entry.room_id][key]) map[entry.room_id][key] = []
          map[entry.room_id][key].push(entry)
        }
      }
    }

    return map
  }, [data, dates])

  // For span rendering: track first day of each entry per room
  const spanMap = useMemo(() => {
    // roomId → entryId → first visible date index
    const map: Record<string, Record<string, number>> = {}
    const allEntries = [...data.reservations, ...data.stays]
    const startStr = format(startDate, 'yyyy-MM-dd')
    const endStr   = format(addDays(startDate, days - 1), 'yyyy-MM-dd')

    for (const entry of allEntries) {
      if (!entry.room_id) continue
      // Clamp to visible range
      const visibleStart = entry.start_date >= startStr ? entry.start_date : startStr
      const visibleEnd   = entry.end_date   <= endStr   ? entry.end_date   : endStr

      const startIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === visibleStart)
      const endIdx   = dates.findIndex(d => format(d, 'yyyy-MM-dd') === visibleEnd)
      const spanDays = (endIdx >= 0 ? endIdx : days) - (startIdx >= 0 ? startIdx : 0)

      if (startIdx >= 0) {
        if (!map[entry.room_id]) map[entry.room_id] = {}
        map[entry.room_id][entry.id] = startIdx
      }
      void spanDays
    }

    return map
  }, [data, dates, startDate, days])

  const COL_WIDTH   = 120
  const LABEL_WIDTH = 96
  const ROW_HEIGHT  = 52

  return (
    <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
      {/* Header row */}
      <div
        className="sticky top-0 z-20 flex"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        {/* Corner */}
        <div
          className="flex-shrink-0 flex items-center justify-center text-xs font-semibold px-2"
          style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, borderRight: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
        >
          Hab.
        </div>

        {dates.map((date) => {
          const today = isToday(date)
          return (
            <div
              key={date.toISOString()}
              className="flex-shrink-0 flex flex-col items-center justify-center text-xs py-1"
              style={{
                width: COL_WIDTH,
                minWidth: COL_WIDTH,
                borderRight: '1px solid var(--border-default)',
                background: today ? 'var(--color-primary)' : undefined,
                color: today ? 'white' : 'var(--text-secondary)',
              }}
            >
              <span className="font-semibold capitalize">{format(date, 'EEE', { locale: es })}</span>
              <span>{format(date, 'd MMM', { locale: es })}</span>
            </div>
          )
        })}
      </div>

      {/* Room rows */}
      {data.rooms.map((room) => (
        <RoomRow
          key={room.id}
          room={room}
          dates={dates}
          entryMap={entryMap[room.id] ?? {}}
          spanMap={spanMap[room.id] ?? {}}
          colWidth={COL_WIDTH}
          labelWidth={LABEL_WIDTH}
          rowHeight={ROW_HEIGHT}
          allEntries={[...data.reservations, ...data.stays]}
          startDate={startDate}
          days={days}
          onEntryClick={onEntryClick}
          onCellClick={onCellClick}
        />
      ))}

      {data.rooms.length === 0 && (
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay habitaciones activas.
        </div>
      )}
    </div>
  )
}

interface RoomRowProps {
  room: CalendarRoom
  dates: Date[]
  entryMap: Record<string, CalendarEntry[]>
  spanMap: Record<string, number>
  colWidth: number
  labelWidth: number
  rowHeight: number
  allEntries: CalendarEntry[]
  startDate: Date
  days: number
  onEntryClick?: (entry: CalendarEntry) => void
  onCellClick?: (roomId: string, date: Date) => void
}

function RoomRow({ room, dates, entryMap, spanMap, colWidth, labelWidth, rowHeight, allEntries, startDate, days, onEntryClick, onCellClick }: RoomRowProps) {
  const startStr = format(startDate, 'yyyy-MM-dd')
  const endStr   = format(addDays(startDate, days - 1), 'yyyy-MM-dd')

  // Get entries that start in this visible range for this room (for span rendering)
  const roomEntries = allEntries.filter(e => e.room_id === room.id && Object.prototype.hasOwnProperty.call(spanMap, e.id))

  return (
    <div
      className="flex relative"
      style={{ borderBottom: '1px solid var(--border-default)', height: rowHeight }}
    >
      {/* Room label */}
      <div
        className="sticky left-0 z-10 flex-shrink-0 flex flex-col justify-center px-2 text-xs"
        style={{
          width: labelWidth,
          minWidth: labelWidth,
          borderRight: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
        }}
      >
        <span className="font-semibold">{room.number}</span>
        {room.house && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{room.house}</span>}
        {room.room_type && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{room.room_type}</span>}
      </div>

      {/* Day cells — background grid */}
      <div className="flex flex-1 relative">
        {dates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const today   = isToday(date)
          const statusColor = roomStatusColor(room.status)
          const hasEntry    = !!entryMap[dateStr]?.length

          return (
            <div
              key={dateStr}
              className={`flex-shrink-0 border-r cursor-pointer transition-colors ${!hasEntry && statusColor ? statusColor + ' opacity-30' : ''}`}
              style={{
                width: colWidth,
                minWidth: colWidth,
                height: rowHeight,
                borderColor: 'var(--border-default)',
                background: today && !hasEntry ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : undefined,
              }}
              onClick={() => !hasEntry && onCellClick?.(room.id, date)}
            />
          )
        })}

        {/* Entry spans rendered absolutely */}
        {roomEntries.map((entry) => {
          const visibleStart = entry.start_date >= startStr ? entry.start_date : startStr
          const visibleEnd   = entry.end_date   <= endStr   ? entry.end_date   : endStr

          const startIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === visibleStart)
          const endIdx   = dates.findIndex(d => format(d, 'yyyy-MM-dd') === visibleEnd)
          const spanCols = (endIdx >= 0 ? endIdx : days) - (startIdx >= 0 ? startIdx : 0)

          if (startIdx < 0 || spanCols <= 0) return null

          const left = startIdx * colWidth + 2
          const width = spanCols * colWidth - 4

          return (
            <button
              key={entry.id + entry.type}
              className={`absolute rounded-md text-xs font-medium truncate px-2 flex items-center cursor-pointer transition-opacity hover:opacity-80 ${entryColor(entry)}`}
              style={{
                left,
                top: 6,
                width,
                height: rowHeight - 12,
                zIndex: 5,
              }}
              onClick={() => onEntryClick?.(entry)}
              title={`${entry.guest_name ?? entry.company_name ?? '—'} · ${entry.nights} noche(s)`}
            >
              {entry.guest_name ?? entry.company_name ?? '—'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
