import { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { MinibarConsumptionType } from '@/types'

export const DOC_LABELS: Record<string, string> = {
  cc: 'CC', ce: 'CE', passport: 'Pasaporte',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', credito: 'Crédito',
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatCurrency(amount: string | number | null | undefined): string {
  if (amount == null) return '—'
  return `$${Number(amount).toLocaleString('es-CO')}`
}

export function nightsElapsed(checkIn: string): number {
  const diffDays = (Date.now() - new Date(checkIn).getTime()) / 86400000
  return Math.max(0, Math.floor(diffDays))
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function nextDayAtTime(iso: string, hhmm: string): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + 1)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  globalThis.URL.revokeObjectURL(url)
}

export function openBlobInNewTab(blob: Blob): void {
  const url = globalThis.URL.createObjectURL(blob)
  globalThis.open(url, '_blank')
}

export function minibarConfirmLabel(saving: boolean, count: number): ReactNode {
  if (saving) return <Loader2 size={14} className="animate-spin mx-auto" />
  if (count > 1) return `Confirmar (${count})`
  return 'Confirmar'
}

export function busyConfirmLabel(busy: boolean): ReactNode {
  if (busy) return <Loader2 size={14} className="animate-spin mx-auto" />
  return 'Confirmar'
}

export function pendingBalanceColor(pending: number): string {
  if (pending > 0) return 'var(--status-occupied)'
  return 'var(--status-available)'
}

export function minibarTypeBadge(type: MinibarConsumptionType): ReactNode {
  if (type === 'consumed') return null
  if (type === 'damaged') {
    return <span className="ml-1 text-xs" style={{ color: '#DC2626' }}>(dañado)</span>
  }
  return <span className="ml-1 text-xs" style={{ color: '#D97706' }}>(faltante)</span>
}

export function isValidMinibarRow(
  product: { name: string } | undefined,
  roomId: string,
  qty: number,
  unit: number,
): product is { name: string } {
  if (!product || !roomId) return false
  if (!qty || qty < 1) return false
  if (unit < 0) return false
  return true
}
