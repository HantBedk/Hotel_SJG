import { ROOM_COLOR } from '../constants/roomStatusTheme'

export default function RoomStatusLegend() {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 shrink-0 text-[10px] font-bold uppercase tracking-wider"
      style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.available }} />
        Disponible
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.occupied }} />
        Ocupada
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.reserved }} />
        Reservada
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.cleaning }} />
        Limpieza
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: ROOM_COLOR.maintenance }} />
        Mant.
      </div>
    </div>
  )
}
