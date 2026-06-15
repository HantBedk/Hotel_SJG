import { Download, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Stay } from '@/types'
import { downloadStayReceiptApi, downloadCheckInReceiptApi } from '@/services/stays.service'
import { downloadBlob, openBlobInNewTab } from './utils'

interface StayReceiptsSectionProps {
  readonly stay: Stay
}

async function fetchStayReceipt(stay: Stay, mode: 'view' | 'download'): Promise<void> {
  try {
    const blob = await downloadStayReceiptApi(stay.id)
    if (mode === 'view') {
      openBlobInNewTab(blob)
    } else {
      downloadBlob(blob, `comprobante-${stay.receipt_number ?? stay.id}.pdf`)
    }
  } catch {
    toast.error('Error al obtener comprobante.')
  }
}

async function fetchCheckInReceipt(stayId: string, mode: 'view' | 'download'): Promise<void> {
  try {
    const blob = await downloadCheckInReceiptApi(stayId)
    if (mode === 'view') {
      openBlobInNewTab(blob)
    } else {
      downloadBlob(blob, `checkin-${stayId}.pdf`)
    }
  } catch {
    toast.error('Error al obtener comprobante de check-in.')
  }
}

export function StayReceiptsSection({ stay }: StayReceiptsSectionProps) {
  return (
    <>
      {stay.status === 'checked_out' && (
        <section>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Comprobante</p>
          {stay.receipt_number && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{stay.receipt_number}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchStayReceipt(stay, 'view')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <ExternalLink size={13} /> Ver PDF
            </button>
            <button
              type="button"
              onClick={() => fetchStayReceipt(stay, 'download')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <Download size={13} /> Descargar
            </button>
          </div>
        </section>
      )}

      <section>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Comprobante de check-in</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchCheckInReceipt(stay.id, 'view')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <ExternalLink size={13} /> Ver PDF
          </button>
          <button
            type="button"
            onClick={() => fetchCheckInReceipt(stay.id, 'download')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <Download size={13} /> Descargar
          </button>
        </div>
      </section>
    </>
  )
}
