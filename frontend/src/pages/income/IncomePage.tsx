import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  DollarSign, BedDouble, Sparkles, ShoppingCart, Wallet, ArrowRight,
  CreditCard, Banknote, ArrowRightLeft, Calendar, ChevronLeft, ChevronRight,
  FileText, X, Printer, Building2, LogIn, User, Phone, Percent, Target,
} from 'lucide-react'
import { useIncomeDaily, useIncomeSummary } from '@/hooks/useIncome'
import { usePaymentsHistory } from '@/hooks/useActivity'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { formatCOP, todayLocalISO, addDaysLocal } from '@/lib/format'
import { formatDateShort, formatDateTime } from '@/lib/formatDate'
import { cn } from '@/lib/cn'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { DOCUMENT_TYPE_OPTIONS } from '@/components/person/documentTypes'
import { fetchIncomeReportHtml, type IncomeRangeParams, type IncomeSummary, type IncomeDailyPoint, type IncomeTonightRoom, type IncomeOccupancySummary } from '@/services/income.service'
import type { PaymentHistoryEntry } from '@/types'
import type { PaymentFilters } from '@/services/activity.service'

type Preset = 'today' | 'week' | 'month' | 'last_30' | 'custom'

const PRESET_LABEL: Record<Preset, string> = {
  today:   'Hoy',
  week:    'Última semana',
  month:   'Este mes',
  last_30: 'Últimos 30 días',
  custom:  'Personalizado',
}

const METHOD_LABEL: Record<string, string> = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  card:     'Tarjeta',
  credito:  'Crédito',
}

const METHOD_ICON: Record<string, React.ElementType> = {
  cash:     Banknote,
  transfer: ArrowRightLeft,
  card:     CreditCard,
  credito:  Wallet,
}

const INCOME_KPI_SKELETON_KEYS = [
  'income-kpi-a',
  'income-kpi-b',
  'income-kpi-c',
  'income-kpi-d',
  'income-kpi-e',
  'income-kpi-f',
] as const

/** Área útil para barras dentro del contenedor h-40 (160px), reservando espacio para etiquetas. */
const CHART_BAR_AREA_PX = 128

function formatNightLabel(date: string | undefined): string {
  if (!date) return '—'
  if (date === todayLocalISO()) return 'hoy'
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short',
  })
}

function localPresetRange(preset: Preset, from: string, to: string): { from: string; to: string } {
  const today = todayLocalISO()
  switch (preset) {
    case 'today':   return { from: today, to: today }
    case 'week':    return { from: addDaysLocal(today, -6), to: today }
    case 'month': {
      const [y, m] = today.split('-').map(Number)
      const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
      return { from: monthStart, to: today }
    }
    case 'last_30': return { from: addDaysLocal(today, -29), to: today }
    default:        return { from, to }
  }
}

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return { dialogRef, backdropClassName }
}

export default function IncomePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialPreset = (searchParams.get('preset') as Preset) ?? 'today'
  const [preset, setPreset] = useState<Preset>(
    ['today', 'week', 'month', 'last_30', 'custom'].includes(initialPreset) ? initialPreset : 'today',
  )
  const [from, setFrom] = useState<string>(searchParams.get('from') ?? todayLocalISO())
  const [to,   setTo]   = useState<string>(searchParams.get('to')   ?? todayLocalISO())

  useEffect(() => {
    const urlPreset = searchParams.get('preset') as Preset | null
    if (urlPreset && (['today', 'week', 'month', 'last_30', 'custom'] as Preset[]).includes(urlPreset)) {
      setPreset(urlPreset)
    }
    const urlFrom = searchParams.get('from')
    const urlTo = searchParams.get('to')
    if (urlFrom) setFrom(urlFrom)
    if (urlTo) setTo(urlTo)
  }, [searchParams])

  const queryParams: IncomeRangeParams = useMemo(
    () => preset === 'custom' ? { from, to } : { preset },
    [preset, from, to],
  )

  const { summary, isLoading, isFetching } = useIncomeSummary(queryParams)
  const { daily, isFetching: fetchingDaily } = useIncomeDaily(queryParams)

  // Filtros independientes para la tabla de pagos recientes (histórico).
  // El rango se deriva del preset/from/to actuales para que respete lo que
  // está viendo el usuario arriba, pero se pueden añadir filtros por método
  // y estado (activo/anulado) que no existen en los KPIs.
  const [paymentsMethod, setPaymentsMethod] = useState<string>('')
  const [paymentsStatus, setPaymentsStatus] = useState<'' | 'active' | 'cancelled'>('')

  const effectiveRange = useMemo(
    () => localPresetRange(preset, from, to),
    [preset, from, to],
  )

  const paymentsFilters = useMemo<PaymentFilters>(() => ({
    date_from: summary?.period.from ?? effectiveRange.from,
    date_to:   summary?.period.to   ?? effectiveRange.to,
    per_page:  50,
    ...(paymentsMethod ? { method: paymentsMethod } : {}),
    ...(paymentsStatus ? { status: paymentsStatus } : {}),
  }), [
    summary?.period.from,
    summary?.period.to,
    effectiveRange.from,
    effectiveRange.to,
    paymentsMethod,
    paymentsStatus,
  ])

  const { data: paymentsHistory, isLoading: loadingPayments } = usePaymentsHistory(paymentsFilters)
  const paymentsRows = paymentsHistory?.data ?? []

  const [openingPdf, setOpeningPdf] = useState(false)
  const [reportHtml, setReportHtml] = useState<string | null>(null)
  const [selectedIncomeRoom, setSelectedIncomeRoom] = useState<IncomeTonightRoom | null>(null)
  const reportIframeRef = useRef<HTMLIFrameElement | null>(null)

  const handleOpenPdf = async () => {
    if (openingPdf) return
    setOpeningPdf(true)
    try {
      const html = await fetchIncomeReportHtml(queryParams)
      setReportHtml(html)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'No se pudo generar el reporte.')
    } finally {
      setOpeningPdf(false)
    }
  }

  const handlePrintReport = () => {
    const win = reportIframeRef.current?.contentWindow
    if (!win) return
    win.focus()
    win.print()
  }

  // Cerrar el modal: useFocusTrap en ReportPreviewModal maneja Escape.
  const changePreset = (next: Preset) => {
    setPreset(next)
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev)
      sp.set('preset', next)
      if (next !== 'custom') { sp.delete('from'); sp.delete('to') }
      return sp
    }, { replace: true })
  }

  const applyCustom = () => {
    setPreset('custom')
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev)
      sp.set('preset', 'custom')
      sp.set('from', from)
      sp.set('to', to)
      return sp
    }, { replace: true })
  }

  const tonight = summary?.tonight
  const nights  = summary?.nights ?? []
  const range   = summary?.range
  const period  = summary?.period
  const occupancySummary = summary?.occupancy_summary
  const maxComparison = Math.max(
    1,
    ...(daily?.data.flatMap((d) => [d.total, d.expected, d.room_revenue]) ?? [1]),
  )
  const maxPaymentsDaily = Math.max(1, ...(daily?.data.map((d) => d.total) ?? [1]))

  const periodRoomRevenue = useMemo(
    () => nights.reduce((sum, n) => sum + n.room_revenue, 0),
    [nights],
  )
  const nightsWithOccupancy = useMemo(
    () => nights.filter((n) => n.room_revenue > 0).length,
    [nights],
  )

  // ── Navegación día a día dentro del rango ──────────────────────────────────
  // Por defecto seleccionamos hoy si está dentro del rango; si no, el último día.
  const [selectedNightIdx, setSelectedNightIdx] = useState(0)
  useEffect(() => {
    if (nights.length === 0) return
    const today = todayLocalISO()
    const todayIdx = nights.findIndex((n) => n.date === today)
    setSelectedNightIdx(todayIdx >= 0 ? todayIdx : nights.length - 1)
  }, [period?.from, period?.to, nights.length])

  const safeIdx = Math.min(Math.max(selectedNightIdx, 0), Math.max(0, nights.length - 1))
  const selectedNight = nights[safeIdx]
  const nightLabel = formatNightLabel(selectedNight?.date)

  return (
    <div className="space-y-5">
      {/* Header con presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1 p-1 rounded-xl"
          style={{ background: 'var(--bg-input)' }}
        >
          {(['today', 'week', 'month', 'last_30', 'custom'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => changePreset(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                preset === p
                  ? { background: 'var(--bg-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {PRESET_LABEL[p]}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={applyCustom}
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Aplicar
            </button>
          </div>
        )}

        {isFetching && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Actualizando…
          </span>
        )}

        {period && (
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {formatDateShort(period.from)} → {formatDateShort(period.to)}
          </span>
        )}

        <button
          onClick={handleOpenPdf}
          disabled={openingPdf || isLoading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
          title={`Ver reporte PDF · ${PRESET_LABEL[preset]}`}
        >
          <FileText size={13} />
          {openingPdf ? 'Generando…' : 'Ver PDF'}
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <IncomeKpiGrid
          isLoading={isLoading}
          preset={preset}
          tonight={tonight}
          period={period}
          periodRoomRevenue={periodRoomRevenue}
          nightsWithOccupancy={nightsWithOccupancy}
          range={range}
          occupancySummary={occupancySummary}
        />
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Col A: Habitaciones generando ingreso (navegable día a día) */}
        <div
          className="lg:col-span-5 rounded-xl p-4 flex flex-col"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={16} style={{ color: '#16A34A' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Detallado de ingreso de habitaciones
              {preset !== 'today' && period ? ` · ${PRESET_LABEL[preset]}` : ''}
            </h3>
            {selectedNight?.rooms_count != null && selectedNight.total_rooms > 0 && (
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--status-available-soft, #ECFDF5)', color: '#16A34A' }}
              >
                {selectedNight.rooms_count}/{selectedNight.total_rooms} · {selectedNight.occupancy_pct}%
              </span>
            )}
          </div>

          {/* Navegación día a día (solo si hay más de 1 noche en el rango) */}
          {nights.length > 1 && (
            <div
              className="flex items-center justify-between gap-2 mb-3 px-2 py-1.5 rounded-lg"
              style={{ background: 'var(--bg-input)' }}
            >
              <button
                onClick={() => setSelectedNightIdx((i) => Math.max(0, i - 1))}
                disabled={safeIdx === 0}
                className="p-1 rounded-md disabled:opacity-30 hover:bg-black/5"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Día anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {nightLabel}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {safeIdx + 1} de {nights.length}
                </span>
              </div>
              <button
                onClick={() => setSelectedNightIdx((i) => Math.min(nights.length - 1, i + 1))}
                disabled={safeIdx >= nights.length - 1}
                className="p-1 rounded-md disabled:opacity-30 hover:bg-black/5"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Día siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {(!selectedNight || selectedNight.rooms.length === 0) ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              No hay habitaciones ocupadas {nightLabel}.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {selectedNight.rooms.map((r) => (
                <button
                  key={r.stay_room_id}
                  type="button"
                  onClick={() => setSelectedIncomeRoom(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: '#16A34A' }}
                  >
                    {r.room_number ?? '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {r.guest_name ?? '—'}
                    </p>
                    {r.company_name && (
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {r.company_name}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#16A34A' }}>
                    {formatCOP(r.price)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div
            className="mt-3 pt-3 flex flex-col gap-2"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Devengado {nightLabel}
              </span>
              <span className="text-lg font-bold tabular-nums" style={{ color: '#16A34A' }}>
                {formatCOP(selectedNight?.room_revenue ?? 0)}
              </span>
            </div>
            {selectedNight && selectedNight.potential_revenue > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: 'var(--text-muted)' }}>
                  Potencial 100% ({selectedNight.total_rooms} hab.)
                </span>
                <span className="font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {formatCOP(selectedNight.potential_revenue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Col B: Gráficos + métodos */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* Esperado vs recaudado */}
          <div
            className={cn('rounded-xl p-4 transition-opacity', (fetchingDaily || isFetching) && 'opacity-60')}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Esperado vs recaudado
              </h3>
              <ChartLegend />
            </div>
            {!daily || daily.data.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Sin datos para el periodo seleccionado.
              </p>
            ) : (
              <ExpectedVsCollectedChart
                data={daily.data}
                granularity={daily.granularity}
                maxTotal={maxComparison}
              />
            )}
          </div>

          {/* Daily bar chart — pagos */}
          <div
            className={cn('rounded-xl p-4 transition-opacity', fetchingDaily && 'opacity-60')}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {daily?.granularity === 'hour' ? 'Pagos por hora' : 'Pagos por día'}
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                {PRESET_LABEL[preset]}
              </span>
            </div>

            {!daily || daily.data.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Sin datos para el periodo seleccionado.
              </p>
            ) : (
              <IncomeDailyChart data={daily.data} maxTotal={maxPaymentsDaily} />
            )}
          </div>

          {/* Métodos de pago */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Por método de pago
            </h3>
            {!summary || summary.payments_by_method.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                Sin pagos en el periodo.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {summary.payments_by_method.map((m) => {
                  const Icon = METHOD_ICON[m.method] ?? DollarSign
                  return (
                    <div
                      key={m.method}
                      className="rounded-lg p-3"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {METHOD_LABEL[m.method] ?? m.method}
                        </span>
                        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {m.count}
                        </span>
                      </div>
                      <p className="text-lg font-bold tabular-nums mt-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCOP(m.total)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagos del periodo (histórico, filtrable) */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Pagos del periodo
            </h3>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {paymentsHistory?.total ?? 0} resultado(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paymentsMethod}
              onChange={(e) => setPaymentsMethod(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-md border bg-transparent"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Todos los métodos</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="credito">Crédito</option>
            </select>

            <select
              value={paymentsStatus}
              onChange={(e) => setPaymentsStatus(e.target.value as '' | 'active' | 'cancelled')}
              className="text-xs px-2 py-1.5 rounded-md border bg-transparent"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Activos y anulados</option>
              <option value="active">Solo activos</option>
              <option value="cancelled">Solo anulados</option>
            </select>

            <button
              onClick={() => navigate('/activity?tab=pagos')}
              className="text-[11px] font-semibold inline-flex items-center gap-1"
              style={{ color: 'var(--color-primary)' }}
            >
              Ver más <ArrowRight size={11} />
            </button>
          </div>
        </div>

        <IncomePaymentsTable
          loading={loadingPayments}
          rows={paymentsRows}
          onStayClick={(stayId) => navigate(`/stays?id=${stayId}`)}
        />
      </div>

      {reportHtml && (
        <ReportPreviewModal
          html={reportHtml}
          presetLabel={PRESET_LABEL[preset]}
          iframeRef={reportIframeRef}
          onClose={() => setReportHtml(null)}
          onPrint={handlePrintReport}
        />
      )}

      <IncomeRoomDetailModal
        room={selectedIncomeRoom}
        nightLabel={nightLabel}
        onClose={() => setSelectedIncomeRoom(null)}
        onOpenStay={(stayId) => {
          setSelectedIncomeRoom(null)
          navigate(`/stays?id=${stayId}`)
        }}
      />
    </div>
  )
}

interface ReportPreviewModalProps {
  readonly html: string
  readonly presetLabel: string
  readonly iframeRef: React.RefObject<HTMLIFrameElement | null>
  readonly onClose: () => void
  readonly onPrint: () => void
}

interface IncomeRoomDetailModalProps {
  readonly room: IncomeTonightRoom | null
  readonly nightLabel: string
  readonly onClose: () => void
  readonly onOpenStay: (stayId: string) => void
}

function stayStatusBadge(status: string | null | undefined) {
  if (!status) return null
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    active:      { label: 'Activa',     color: 'var(--status-occupied)',  bg: 'var(--status-occupied-soft)' },
    extended:    { label: 'Extendida',  color: 'var(--status-reserved)',  bg: 'var(--status-warning-soft)' },
    checked_out: { label: 'Cerrada',    color: 'var(--text-secondary)',   bg: 'var(--bg-input)' },
  }
  const meta = configs[status] ?? configs.active
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

function documentTypeLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return DOCUMENT_TYPE_OPTIONS.find((d) => d.value === type)?.label ?? type.toUpperCase()
}

function IncomeDetailSection({ title, icon: Icon, children }: {
  readonly title: string
  readonly icon: React.ElementType
  readonly children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color: 'var(--text-muted)' }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
      </div>
      <div className="rounded-lg px-3" style={{ background: 'var(--bg-input)' }}>
        {children}
      </div>
    </div>
  )
}

function IncomeDetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
}

function IncomeRoomDetailModal({ room, nightLabel, onClose, onOpenStay }: IncomeRoomDetailModalProps) {
  const open = room !== null
  const title = room ? `Habitación ${room.room_number ?? '—'}` : ''
  const documentLine = room?.document_type && room.document_number
    ? `${documentTypeLabel(room.document_type)} · ${room.document_number}`
    : room?.document_number ?? '—'

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {room && (
        <div className="px-5 pb-5">
          <div
            className="flex items-center justify-between gap-3 p-3 rounded-xl mb-4"
            style={{
              background: 'var(--status-available-soft)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: 'var(--status-available)', color: 'var(--text-inverse)' }}
              >
                {room.room_number ?? '—'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {room.guest_name ?? '—'}
                </p>
                {room.company_name && (
                  <p className="text-[11px] truncate flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <Building2 size={11} />
                    {room.company_name}
                  </p>
                )}
              </div>
            </div>
            {stayStatusBadge(room.status)}
          </div>

          <IncomeDetailSection title="Huésped" icon={User}>
            <IncomeDetailRow label="Nombre completo">
              {room.guest_name ?? '—'}
            </IncomeDetailRow>
            <IncomeDetailRow label="Documento">
              <span className="inline-flex items-center gap-1">
                <CreditCard size={12} style={{ color: 'var(--text-muted)' }} />
                {documentLine}
              </span>
            </IncomeDetailRow>
            <IncomeDetailRow label="Teléfono">
              <span className="inline-flex items-center gap-1">
                <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                {room.phone?.trim() || '—'}
              </span>
            </IncomeDetailRow>
          </IncomeDetailSection>

          <IncomeDetailSection title="Estadía" icon={LogIn}>
            <IncomeDetailRow label="Entrada">
              {formatDateTime(room.check_in_datetime)}
            </IncomeDetailRow>
            <IncomeDetailRow label="Salida">
              {formatDateTime(room.check_out_datetime)}
            </IncomeDetailRow>
          </IncomeDetailSection>

          <IncomeDetailSection title="Ingreso de habitación" icon={BedDouble}>
            <IncomeDetailRow label="Noche devengada">
              {nightLabel}
            </IncomeDetailRow>
            <IncomeDetailRow label="Tarifa por noche">
              <span className="font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
                {formatCOP(room.price)}
              </span>
            </IncomeDetailRow>
          </IncomeDetailSection>

          <div className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => onOpenStay(room.stay_id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              Ver estadía completa
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ReportPreviewModal({ html, presetLabel, iframeRef, onClose, onPrint }: ReportPreviewModalProps) {
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Reporte de ingresos · ${presetLabel}`}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-5xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Reporte de ingresos · {presetLabel}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--color-primary)' }}
              title="Imprimir o guardar como PDF"
            >
              <Printer size={13} />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ background: '#f3f4f6' }}>
          <iframe
            ref={iframeRef}
            title="Reporte de ingresos"
            srcDoc={html}
            className="w-full h-full border-0"
            style={{ minHeight: '60vh' }}
          />
        </div>
      </div>
    </dialog>
  )
}

interface IncomeDailyChartProps {
  readonly data: IncomeDailyPoint[]
  readonly maxTotal: number
}

const CHART_COLOR_EXPECTED = '#F59E0B'
const CHART_COLOR_COLLECTED = 'var(--color-primary)'
const CHART_COLOR_ACCRUED = '#16A34A'

function ChartLegend() {
  const items = [
    { key: 'expected', color: CHART_COLOR_EXPECTED, label: 'Esperado (100%)' },
    { key: 'collected', color: CHART_COLOR_COLLECTED, label: 'Recaudado' },
    { key: 'accrued', color: CHART_COLOR_ACCRUED, label: 'Devengado hab.' },
  ] as const

  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium">
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} aria-hidden /><span>{item.label}</span>
        </span>
      ))}
    </div>
  )
}

interface ExpectedVsCollectedChartProps {
  readonly data: IncomeDailyPoint[]
  readonly granularity: 'hour' | 'day'
  readonly maxTotal: number
}

function ExpectedVsCollectedChart({ data, granularity, maxTotal }: ExpectedVsCollectedChartProps) {
  if (granularity === 'hour') {
    const collected = data.reduce((sum, p) => sum + p.total, 0)
    const expected = data[0]?.expected ?? 0
    const accrued = data[0]?.room_revenue ?? 0
    const occupancy = data[0]?.occupancy_pct ?? 0
    return (
      <DayComparisonBars
        expected={expected}
        collected={collected}
        accrued={accrued}
        occupancyPct={occupancy}
        maxTotal={Math.max(maxTotal, expected, collected, accrued, 1)}
      />
    )
  }

  return (
    <div className="flex items-end gap-1.5 h-44">
      {data.map((point) => {
        const expectedBar = Math.max(2, Math.round((point.expected / maxTotal) * CHART_BAR_AREA_PX))
        const collectedBar = Math.max(2, Math.round((point.total / maxTotal) * CHART_BAR_AREA_PX))
        const accruedBar = Math.max(2, Math.round((point.room_revenue / maxTotal) * CHART_BAR_AREA_PX))
        return (
          <div
            key={point.date}
            className="flex-1 flex flex-col justify-end items-center gap-1.5 min-w-0 h-full"
            title={`Ocupación: ${point.occupancy_pct}%`}
          >
            <div className="flex items-end justify-center gap-0.5 w-full shrink-0" style={{ height: CHART_BAR_AREA_PX }}>
              <div
                className="w-[30%] max-w-[14px] rounded-t-sm"
                style={{ height: expectedBar, background: CHART_COLOR_EXPECTED }}
                title={`Esperado: ${formatCOP(point.expected)}`}
              />
              <div
                className="w-[30%] max-w-[14px] rounded-t-sm"
                style={{ height: collectedBar, background: CHART_COLOR_COLLECTED }}
                title={`Recaudado: ${formatCOP(point.total)}`}
              />
              <div
                className="w-[30%] max-w-[14px] rounded-t-sm opacity-80"
                style={{ height: accruedBar, background: CHART_COLOR_ACCRUED }}
                title={`Devengado: ${formatCOP(point.room_revenue)}`}
              />
            </div>
            <span
              className="text-[9px] truncate w-full text-center shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              {point.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface DayComparisonBarsProps {
  readonly expected: number
  readonly collected: number
  readonly accrued: number
  readonly occupancyPct: number
  readonly maxTotal: number
}

function DayComparisonBars({ expected, collected, accrued, occupancyPct, maxTotal }: DayComparisonBarsProps) {
  const rows = [
    { key: 'expected', label: 'Esperado (100% ocupación)', value: expected, color: CHART_COLOR_EXPECTED },
    { key: 'collected', label: 'Recaudado hoy', value: collected, color: CHART_COLOR_COLLECTED },
    { key: 'accrued', label: 'Devengado habitaciones', value: accrued, color: CHART_COLOR_ACCRUED },
  ] as const

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        Ocupación del día: <strong>{occupancyPct}%</strong>
      </p>
      {rows.map((row) => {
        const widthPct = Math.max(2, Math.round((row.value / maxTotal) * 100))
        return (
          <div key={row.key}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCOP(row.value)}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${widthPct}%`, background: row.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IncomeDailyChart({ data, maxTotal }: IncomeDailyChartProps) {
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((point) => {
        const barPx = Math.max(2, Math.round((point.total / maxTotal) * CHART_BAR_AREA_PX))
        return (
          <div
            key={point.date}
            className="flex-1 flex flex-col justify-end items-center gap-1.5 min-w-0 h-full"
          >
            <div
              className="w-full rounded-t-md transition-all shrink-0"
              style={{
                height: barPx,
                background: point.total > 0 ? 'var(--color-primary)' : 'var(--border-default)',
                opacity: point.total > 0 ? 1 : 0.4,
              }}
              title={`${point.label}: ${formatCOP(point.total)}`}
            />
            <span
              className="text-[9px] truncate w-full text-center shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              {point.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface IncomeKpiGridProps {
  readonly isLoading: boolean
  readonly preset: Preset
  readonly tonight: IncomeSummary['tonight'] | undefined
  readonly period: IncomeSummary['period'] | undefined
  readonly periodRoomRevenue: number
  readonly nightsWithOccupancy: number
  readonly range: IncomeSummary['range'] | undefined
  readonly occupancySummary: IncomeOccupancySummary | undefined
}

function IncomeKpiGrid({
  isLoading,
  preset,
  tonight,
  period,
  periodRoomRevenue,
  nightsWithOccupancy,
  range,
  occupancySummary,
}: IncomeKpiGridProps) {
  if (isLoading) {
    return INCOME_KPI_SKELETON_KEYS.map((key) => <SkeletonCard key={key} />)
  }

  const isToday = preset === 'today'
  const occupancyPct = isToday
    ? (tonight?.occupancy_pct ?? 0)
    : (occupancySummary?.avg_occupancy_pct ?? 0)
  const occupancySub = isToday
    ? `${tonight?.rooms_count ?? 0} de ${tonight?.total_rooms ?? 0} habitaciones`
    : `Promedio · ${occupancySummary?.total_rooms ?? 0} hab. habilitadas`

  const potentialValue = isToday
    ? (tonight?.potential_revenue ?? 0)
    : (occupancySummary?.total_potential_revenue ?? 0)
  const potentialSub = isToday
    ? '100% ocupación · tarifa base por tipo'
    : `Acumulado ${period?.days ?? 0} días al 100%`

  const roomLabel = isToday
    ? 'Ingreso diario de habitaciones'
    : `Ingreso habitaciones · ${PRESET_LABEL[preset]}`
  const roomValue = isToday ? (tonight?.room_revenue ?? 0) : periodRoomRevenue
  const roomSub = isToday
    ? `${((tonight?.revenue_vs_potential_pct ?? 0)).toFixed(1)}% del potencial`
    : `${period?.days ?? 0} días · ${nightsWithOccupancy} con ocupación`

  const capturePct = occupancySummary?.payments_vs_potential_pct ?? 0

  return (
    <>
      <KpiCard
        label={isToday ? 'Ocupación hoy' : `Ocupación · ${PRESET_LABEL[preset]}`}
        value={`${occupancyPct}%`}
        sub={occupancySub}
        icon={Percent}
        color="#0EA5E9"
        colorBg="#E0F2FE"
      />
      <KpiCard
        label={isToday ? 'Potencial del día' : 'Potencial del periodo'}
        value={formatCOP(potentialValue)}
        sub={potentialSub}
        icon={Target}
        color="#F59E0B"
        colorBg="#FFFBEB"
      />
      <KpiCard
        label={roomLabel}
        value={formatCOP(roomValue)}
        sub={roomSub}
        icon={BedDouble}
        color="#16A34A"
        colorBg="#ECFDF5"
      />
      <KpiCard
        label={`Pagos recibidos · ${PRESET_LABEL[preset]}`}
        value={formatCOP(range?.payments_received ?? 0)}
        sub={`${capturePct.toFixed(1)}% del potencial · ${range?.payments_count ?? 0} pagos`}
        icon={Wallet}
        color="var(--color-primary)"
        colorBg="var(--color-primary-light)"
      />
      <KpiCard
        label="Servicios cobrados"
        value={formatCOP(range?.services_billed ?? 0)}
        sub="Servicios extra aplicados"
        icon={Sparkles}
        color="#8B5CF6"
        colorBg="#F5F3FF"
      />
      <KpiCard
        label="Minibar"
        value={formatCOP(range?.minibar_billed ?? 0)}
        sub="Consumos registrados"
        icon={ShoppingCart}
        color="#F97316"
        colorBg="#FFF7ED"
      />
    </>
  )
}

interface IncomePaymentsTableProps {
  readonly loading: boolean
  readonly rows: PaymentHistoryEntry[]
  readonly onStayClick: (stayId: string) => void
}

function IncomePaymentsTable({ loading, rows, onStayClick }: IncomePaymentsTableProps) {
  if (loading) {
    return (
      <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        No hay pagos que coincidan con los filtros.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: 'var(--text-muted)' }}>
            <th className="text-left font-semibold py-2 px-2">Fecha</th>
            <th className="text-left font-semibold py-2 px-2">Huésped</th>
            <th className="text-left font-semibold py-2 px-2">Recepción</th>
            <th className="text-left font-semibold py-2 px-2">Método</th>
            <th className="text-left font-semibold py-2 px-2">Estado</th>
            <th className="text-right font-semibold py-2 px-2">Monto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const cancelled = !!p.cancelled_at
            return (
              <tr
                key={p.id}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                onClick={() => onStayClick(p.stay_id)}
              >
                <td className="py-2 px-2 whitespace-nowrap">
                  {new Date(p.payment_date).toLocaleString('es-CO', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="py-2 px-2">
                  <span className="font-medium">{p.guest_name ?? '—'}</span>
                </td>
                <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                  {p.receptionist ?? '—'}
                </td>
                <td className="py-2 px-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                  >
                    {METHOD_LABEL[p.payment_method] ?? p.payment_method}
                  </span>
                </td>
                <td className="py-2 px-2">
                  {cancelled ? (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: '#FEF2F2', color: '#DC2626' }}
                      title={p.cancellation_reason ?? 'Anulado'}
                    >
                      Anulado
                    </span>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: '#F0FDF4', color: '#16A34A' }}
                    >
                      Activo
                    </span>
                  )}
                </td>
                <td
                  className="py-2 px-2 text-right font-bold tabular-nums"
                  style={{
                    color: cancelled ? '#9CA3AF' : '#16A34A',
                    textDecoration: cancelled ? 'line-through' : undefined,
                  }}
                >
                  {formatCOP(Number(p.amount))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface KpiCardProps {
  readonly label: string
  readonly value: string
  readonly sub: string
  readonly icon: React.ElementType
  readonly color: string
  readonly colorBg: string
}

function KpiCard({ label, value, sub, icon: Icon, color, colorBg }: KpiCardProps) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col justify-between"
      style={{
        background:  'var(--bg-surface)',
        border:      '1px solid var(--border-default)',
        boxShadow:   'var(--shadow-sm)',
        minHeight:   '84px',
      }}
    >
      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="flex items-end justify-between mt-1.5">
        <div className="min-w-0">
          <p className="text-xl font-bold tracking-tight leading-tight tabular-nums truncate" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2"
          style={{ background: colorBg }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  )
}
