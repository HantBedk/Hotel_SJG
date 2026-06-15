import { useState } from 'react'
import { useOccupancyHistory } from '@/hooks/useDashboard'

type Period = 'semanal' | 'mensual'

export function DashboardChart() {
  const [period, setPeriod] = useState<Period>('semanal')
  const apiPeriod = period === 'semanal' ? 'weekly' : 'monthly'
  const { history, isLoading } = useOccupancyHistory(apiPeriod)

  const points = history?.data ?? []
  const allZero = points.every((d) => d.rate === 0)

  const generatePath = () => {
    if (points.length < 2) return ''
    const maxX = points.length - 1
    const scaleX = (x: number) => (x / maxX) * 100
    const scaleY = (y: number) => 100 - (y / 100) * 90 - 5
    let path = `M ${scaleX(0)},${scaleY(points[0].rate)}`
    for (let i = 0; i < points.length - 1; i++) {
      const x0 = scaleX(i),     y0 = scaleY(points[i].rate)
      const x1 = scaleX(i + 1), y1 = scaleY(points[i + 1].rate)
      const cp = (x1 - x0) / 2
      path += ` C ${x0 + cp},${y0} ${x0 + cp},${y1} ${x1},${y1}`
    }
    return path
  }

  const pathD = generatePath()
  const areaD = pathD ? `${pathD} L 100,95 L 0,95 Z` : ''

  let chartContent
  if (isLoading) {
    chartContent = (
      <div className="absolute inset-0 flex items-center justify-center pl-8">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    )
  } else if (allZero) {
    chartContent = (
      <div className="absolute inset-0 flex items-center justify-center pl-8">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin datos de ocupación aún</p>
      </div>
    )
  } else {
    chartContent = (
      <svg className="absolute inset-0 h-full w-full pl-8 pb-4" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="dashChartGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaD && <path d={areaD} fill="url(#dashChartGrad)" />}
        {pathD && <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />}
        {points.map((d, i) => {
          const x = (i / (points.length - 1)) * 100
          const y = 100 - (d.rate / 100) * 90 - 5
          return <circle key={d.label} cx={x} cy={y} r="1.5" fill="var(--color-primary)" />
        })}
      </svg>
    )
  }

  return (
    <div
      className="rounded-xl p-3 flex flex-col flex-1 min-h-0"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', minHeight: '140px' }}
    >
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          Ocupación {period === 'semanal' ? 'Semanal' : 'Mensual'}
        </h3>
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ background: 'var(--bg-input)' }}
        >
          {(['semanal', 'mensual'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2.5 py-1 text-[10px] font-bold rounded-md transition-all"
              style={{
                background: period === p ? 'var(--bg-surface)' : 'transparent',
                color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: period === p ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 w-full">
        {/* Y-axis labels */}
        <div
          className="absolute inset-0 flex flex-col justify-between text-[9px] font-medium pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        >
          {['100%', '75%', '50%', '25%', '0%'].map((label) => (
            <div key={label} className="flex items-center gap-1">
              <span style={{ minWidth: '22px' }}>{label}</span>
              <div className="flex-1 border-t" style={{ borderColor: 'var(--border-default)', opacity: 0.5 }} />
            </div>
          ))}
        </div>

        {chartContent}

        {/* X-axis labels */}
        {points.length > 0 && (
          <div
            className="absolute bottom-0 right-0 flex justify-between text-[9px] font-semibold"
            style={{ left: '30px', color: 'var(--text-muted)' }}
          >
            {points.map((d) => <span key={d.label}>{d.label}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}
