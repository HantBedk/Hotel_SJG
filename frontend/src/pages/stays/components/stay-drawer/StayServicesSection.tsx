import { useState } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import type { Stay } from '@/types'
import { useExtraServices } from '@/hooks/useStays'
import { formatCurrency } from './utils'

interface StayServicesSectionProps {
  readonly stayId: string
  readonly stay: Stay
  readonly onAddService: (payload: { stayId: string; extra_service_id: string; quantity: number }) => void
}

export function StayServicesSection({ stayId, stay, onAddService }: StayServicesSectionProps) {
  const { data: extraServices = [] } = useExtraServices()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ extra_service_id: '', quantity: '1' })

  const handleAdd = () => {
    const qty = Number.parseInt(form.quantity, 10)
    if (!form.extra_service_id || !qty || qty < 1) return
    onAddService({ stayId, extra_service_id: form.extra_service_id, quantity: qty })
    setShowForm(false)
    setForm({ extra_service_id: '', quantity: '1' })
  }

  if (stay.status !== 'active') return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Servicios extra</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={12} /> Agregar
          </button>
        )}
      </div>

      {stay.services && stay.services.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {stay.services.map((s) => (
            <div key={s.id} className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>
                {s.extra_service?.name ?? 'Servicio'} × {s.quantity}
              </span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(s.total)}
              </span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
        >
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.extra_service_id}
              onChange={(e) => setForm((s) => ({ ...s, extra_service_id: e.target.value }))}
              className="col-span-2 px-2 py-2 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="">Seleccionar servicio...</option>
              {extraServices.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.name} — {formatCurrency(es.price)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              placeholder="Cant."
              value={form.quantity}
              onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
              className="px-2 py-2 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.extra_service_id}
              className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
