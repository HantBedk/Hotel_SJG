import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  DollarSign, BedDouble, Sparkles, ShoppingCart, Wallet, ArrowRight,
  CreditCard, Banknote, ArrowRightLeft, Calendar, ChevronLeft, ChevronRight,
  FileText, X, Printer,
} from 'lucide-react'
import { useIncomeDaily, useIncomeSummary } from '@/hooks/useIncome'
import { usePaymentsHistory } from '@/hooks/useActivity'
import { formatCOP } from '@/lib/format'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { fetchIncomeReportHtml, type IncomeRangeParams } from '@/services/income.service'
import type { PaymentFilters } from '@/services/activity.service'

type Preset = 'today' | 'week' | 'month' | 'last_30' | 'custom'

const PRESET_LABEL: Record<Preset, string> = {
  today:   'Hoy',
  week:    'Esta semana',
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function IncomePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialPreset = (searchParams.get('preset') as Preset) ?? 'today'
  const [preset, setPreset] = useState<Preset>(
    ['today', 'week', 'month', 'last_30', 'custom'].includes(initialPreset) ? initialPreset : 'today',
  )
  const [from, setFrom] = useState<string>(searchParams.get('from') ?? todayIso())
  const [to,   setTo]   = useState<string>(searchParams.get('to')   ?? todayIso())

  const queryParams: IncomeRangeParams = useMemo(
    () => preset === 'custom' ? { from, to } : { preset },
    [preset, from, to],
  )

  const { summary, isLoading, isFetching } = useIncomeSummary(queryParams)
  const { daily }                          = useIncomeDaily(queryParams)

  // Filtros independientes para la tabla de pagos recientes (histórico).
  // El rango se deriva del preset/from/to actuales para que respete lo que
  // está viendo el usuario arriba, pero se pueden añadir filtros por método
  // y estado (activo/anulado) que no existen en los KPIs.
  const [paymentsMethod, setPaymentsMethod] = useState<string>('')
  const [paymentsStatus, setPaymentsStatus] = useState<'' | 'active' | 'cancelled'>('')

  const effectiveRange = useMemo<{ from: string; to: string }>(() => {
    const t = new Date()
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const today = fmt(t)
    switch (preset) {
      case 'today':   return { from: today, to: today }
      case 'week':    return { from: fmt(new Date(t.getTime() - 6 * 86400_000)),  to: today }
      case 'month':   return { from: fmt(new Date(t.getFullYear(), t.getMonth(), 1)), to: today }
      case 'last_30': return { from: fmt(new Date(t.getTime() - 29 * 86400_000)), to: today }
      default:        return { from, to }
    }
  }, [preset, from, to])

  const paymentsFilters = useMemo<PaymentFilters>(() => ({
    date_from: effectiveRange.from,
    date_to:   effectiveRange.to,
    per_page:  50,
    ...(paymentsMethod ? { method: paymentsMethod } : {}),
    ...(paymentsStatus ? { status: paymentsStatus } : {}),
  }), [effectiveRange.from, effectiveRange.to, paymentsMethod, paymentsStatus])

  const { data: paymentsHistory, isLoading: loadingPayments } = usePaymentsHistory(paymentsFilters)
  const paymentsRows = paymentsHistory?.data ?? []

  const [openingPdf, setOpeningPdf] = useState(false)
  const [reportHtml, setReportHtml] = useState<string | null>(null)
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

  // Cerrar el modal con Escape.
  useEffect(() => {
    if (!reportHtml) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReportHtml(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [reportHtml])

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
  const maxDaily = Math.max(1, ...(daily?.data.map((d) => d.total) ?? [1]))

  // ── Navegación día a día dentro del rango ──────────────────────────────────
  // Por defecto seleccionamos hoy si está dentro del rango; si no, el último día.
  const [selectedNightIdx, setSelectedNightIdx] = useState(0)
  useEffect(() => {
    if (nights.length === 0) return
    const today = todayIso()
    const todayIdx = nights.findIndex((n) => n.date === today)
    setSelectedNightIdx(todayIdx >= 0 ? todayIdx : nights.length - 1)
  }, [summary?.period.from, summary?.period.to, nights.length])

  const safeIdx        = Math.min(Math.max(selectedNightIdx, 0), Math.max(0, nights.length - 1))
  const selectedNight  = nights[safeIdx]
  const isToday        = selectedNight?.date === todayIso()
  const nightLabel     = selectedNight
    ? (isToday
        ? 'hoy'
        : new Date(selectedNight.date + 'T12:00:00').toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'short',
          }))
    : '—'

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Ingreso diario de habitaciones"
              value={formatCOP(tonight?.room_revenue ?? 0)}
              sub={`${tonight?.rooms_count ?? 0} habitaciones generando ingreso`}
              icon={BedDouble}
              color="#16A34A"
              colorBg="#ECFDF5"
            />
            <KpiCard
              label={`Pagos recibidos · ${PRESET_LABEL[preset]}`}
              value={formatCOP(range?.payments_received ?? 0)}
              sub={`${range?.payments_count ?? 0} pagos en el periodo`}
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
        )}
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
              Detallado de ingreso diario de habitaciones
            </h3>
            {selectedNight?.rooms_count != null && (
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#ECFDF5', color: '#16A34A' }}
              >
                {selectedNight.rooms_count}
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
                  onClick={() => navigate(`/stays?id=${r.stay_id}`)}
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
            className="mt-3 pt-3 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Total devengado {nightLabel}
            </span>
            <span className="text-lg font-bold tabular-nums" style={{ color: '#16A34A' }}>
              {formatCOP(selectedNight?.room_revenue ?? 0)}
            </span>
          </div>
        </div>

        {/* Col B: Gráfico diario + métodos */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* Daily bar chart */}
          <div
            className="rounded-xl p-4"
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
              <div className="flex items-end gap-1.5 h-40">
                {daily.data.map((d) => {
                  const h = Math.max(2, Math.round((d.total / maxDaily) * 100))
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${h}%`,
                            background: d.total > 0 ? 'var(--color-primary)' : 'var(--border-default)',
                            opacity: d.total > 0 ? 1 : 0.4,
                          }}
                          title={`${d.label}: ${formatCOP(d.total)}`}
                        />
                      </div>
                      <span className="text-[9px] truncate w-full text-center" style={{ color: 'var(--text-muted)' }}>
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
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

        {loadingPayments ? (
          <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
        ) : paymentsRows.length === 0 ? (
          <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No hay pagos que coincidan con los filtros.
          </p>
        ) : (
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
                {paymentsRows.map((p) => {
                  const cancelled = !!p.cancelled_at
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      onClick={() => navigate(`/stays?id=${p.stay_id}`)}
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
        )}
      </div>

      {/* Modal: vista previa del reporte de ingresos */}
      {reportHtml && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.55)' }}
          onClick={() => setReportHtml(null)}
        >
          <div
            className="w-full max-w-5xl rounded-xl shadow-2xl flex flex-col"
            style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Reporte de ingresos · {PRESET_LABEL[preset]}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ background: 'var(--color-primary)' }}
                  title="Imprimir o guardar como PDF"
                >
                  <Printer size={13} />
                  Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setReportHtml(null)}
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
                ref={reportIframeRef}
                title="Reporte de ingresos"
                srcDoc={reportHtml}
                className="w-full h-full border-0"
                style={{ minHeight: '60vh' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
  colorBg: string
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
