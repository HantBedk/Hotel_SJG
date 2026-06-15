import { cn } from '@/lib/cn'

interface SkeletonProps {
  readonly className?: string
  readonly width?: string | number
  readonly height?: string | number
  readonly style?: React.CSSProperties
}

export function Skeleton({ className, width, height, style }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
    </div>
  )
}

interface SkeletonTableProps {
  readonly rows?: number
  readonly cols?: number
}

function buildSkeletonTableRows(rowCount: number, colCount: number) {
  return Array.from({ length: rowCount }, (_, rowIndex) => ({
    key: `skeleton-table-row-${rowIndex + 1}`,
    colKeys: Array.from(
      { length: colCount },
      (_, colIndex) => `skeleton-table-r${rowIndex + 1}-c${colIndex + 1}`,
    ),
  }))
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  const tableRows = buildSkeletonTableRows(rows, cols)

  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full rounded-lg" />
      {tableRows.map((row) => (
        <div key={row.key} className="flex gap-4">
          {row.colKeys.map((colKey) => (
            <Skeleton key={colKey} className="h-8 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface SkeletonTextProps {
  readonly lines?: number
}

function buildSkeletonTextLines(lineCount: number) {
  return Array.from({ length: lineCount }, (_, lineIndex) => ({
    key: `skeleton-text-line-${lineIndex + 1}`,
    width: lineIndex === lineCount - 1 ? '60%' : '100%',
  }))
}

export function SkeletonText({ lines = 3 }: SkeletonTextProps) {
  const textLines = buildSkeletonTextLines(lines)

  return (
    <div className="space-y-2">
      {textLines.map((line) => (
        <Skeleton
          key={line.key}
          className="h-4 rounded"
          style={{ width: line.width }}
        />
      ))}
    </div>
  )
}
