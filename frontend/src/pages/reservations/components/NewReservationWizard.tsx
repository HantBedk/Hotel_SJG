import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Search, User, Building2, CheckCircle } from 'lucide-react'
import { useGuestSearch } from '@/hooks/useGuests'
import { useCompanySearch } from '@/hooks/useCompanies'
import { useReservations } from '@/hooks/useReservations'
import type { Guest, Company } from '@/types'

interface Props {
  prefillStartDate?: string
  prefillRoom?: Room
  onClose: () => void
  onSuccess?: () => void
}

type StepId = 'guest' | 'company' | 'room' | 'dates' | 'confirmation'

interface WizardState {
  guest: Guest | null
  guestSearch: string
  withCompany: boolean
  company: Company | null
  companySearch: string
  roomSearch: string
  startDate: string
  endDate: string
  agreedPrice: string
  depositAmount: string
  notes: string
}

function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0
  const d1 = new Date(start)
  const d2 = new Date(end)
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000))
}

const STEPS: StepId[] = ['guest', 'company', 'room', 'dates', 'confirmation']
const STEP_LABELS: Record<StepId, string> = {
  guest:        'Huésped',
  company:      'Empresa',
  room:         'Habitación',
  dates:        'Fechas y precio',
  confirmation: 'Confirmación',
}

export default function NewReservationWizard({ prefillStartDate, prefillRoom, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [step, setStep] = useState<StepId>('guest')
  const [state, setState] = useState<WizardState>({
    guest:         null,
    guestSearch:   '',
    withCompany:   false,
    company:       null,
    companySearch: '',
    roomSearch:    '',
    startDate:     prefillStartDate ?? today,
    endDate:       prefillStartDate ? addDays(prefillStartDate, 1) : addDays(today, 1),
    agreedPrice:   prefillRoom ? String(prefillRoom.room_type?.base_price ?? '') : '',
    depositAmount: '',
    notes:         '',
  })

  const { create, isCreating } = useReservations()
  const { data: guestResults = [], isLoading: guestsLoading } = useGuestSearch(state.guestSearch)
  const { data: companyResults = [], isLoading: companiesLoading } = useCompanySearch(state.companySearch)

  const nights = nightsBetween(state.startDate, state.endDate)

  const stepIndex = STEPS.indexOf(step)

  const canAdvance = (): boolean => {
    switch (step) {
      case 'guest':        return !!state.guest
      case 'company':      return true
      case 'room':         return true
      case 'dates':        return !!state.startDate && !!state.endDate && nights > 0 && !!state.agreedPrice && Number(state.agreedPrice) >= 0
      case 'confirmation': return true
    }
  }

  const next = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  const prev = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const handleConfirm = async () => {
    await create({
      guest_id:       state.guest?.id,
      company_id:     state.company?.id,
      start_date:     state.startDate,
      end_date:       state.endDate,
      agreed_price:   Number(state.agreedPrice),
      deposit_amount: state.depositAmount ? Number(state.depositAmount) : undefined,
      notes:          state.notes || undefined,
    })
    onSuccess?.()
  }

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState(prev => ({ ...prev, [key]: value }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Nueva Reserva</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Paso {stepIndex + 1} de {STEPS.length} · {STEP_LABELS[step]}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: 'var(--border-default)' }}>
          <div
            className="h-1 transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%`, background: 'var(--color-primary)' }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP: GUEST */}
          {step === 'guest' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Buscar huésped</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
                  style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  placeholder="Nombre o documento..."
                  value={state.guestSearch}
                  onChange={e => set('guestSearch', e.target.value)}
                />
              </div>

              {state.guest && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-main)', border: '2px solid var(--color-primary)' }}>
                  <User size={16} style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{state.guest.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.guest.document_number}</p>
                  </div>
                  <button onClick={() => set('guest', null)} style={{ color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {!state.guest && state.guestSearch.length > 1 && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                  {guestsLoading ? (
                    <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
                  ) : guestResults.length === 0 ? (
                    <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>
                  ) : (
                    (guestResults as Guest[]).slice(0, 6).map((g) => (
                      <button
                        key={g.id}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 transition-colors border-b last:border-0"
                        style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        onClick={() => { set('guest', g); set('guestSearch', '') }}
                      >
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <p className="text-sm font-medium">{g.full_name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.document_number}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP: COMPANY */}
          {step === 'company' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.withCompany}
                  onChange={e => { set('withCompany', e.target.checked); if (!e.target.checked) set('company', null) }}
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Asociar empresa</span>
              </label>

              {state.withCompany && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      placeholder="Nombre o NIT..."
                      value={state.companySearch}
                      onChange={e => set('companySearch', e.target.value)}
                    />
                  </div>

                  {state.company && (
                    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-main)', border: '2px solid var(--color-primary)' }}>
                      <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{state.company.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.company.nit}</p>
                      </div>
                      <button onClick={() => set('company', null)} style={{ color: 'var(--text-muted)' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {!state.company && state.companySearch.length > 1 && (
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                      {companiesLoading ? (
                        <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
                      ) : companyResults.length === 0 ? (
                        <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>
                      ) : (
                        (companyResults as Company[]).slice(0, 5).map((c) => (
                          <button
                            key={c.id}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 border-b last:border-0"
                            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                            onClick={() => { set('company', c); set('companySearch', '') }}
                          >
                            <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                            <div>
                              <p className="text-sm font-medium">{c.name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.nit}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {!state.withCompany && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reserva individual sin empresa asociada.</p>
              )}
            </div>
          )}

          {/* STEP: ROOM */}
          {step === 'room' && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                La habitación específica puede asignarse al hacer el check-in. Si ya sabes cuál es, puedes anotarla en las notas.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notas de habitación (opcional)</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  placeholder="Ej: Suite 201, vista al mar..."
                  value={state.roomSearch}
                  onChange={e => set('roomSearch', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP: DATES */}
          {step === 'dates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Llegada</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    value={state.startDate}
                    min={today}
                    onChange={e => {
                      set('startDate', e.target.value)
                      if (e.target.value >= state.endDate) {
                        set('endDate', addDays(e.target.value, 1))
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Salida</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    value={state.endDate}
                    min={addDays(state.startDate, 1)}
                    onChange={e => set('endDate', e.target.value)}
                  />
                </div>
              </div>

              {nights > 0 && (
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                  {nights} noche{nights !== 1 ? 's' : ''}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Precio acordado (total)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 rounded-lg text-sm border"
                    style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    value={state.agreedPrice}
                    onChange={e => set('agreedPrice', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Depósito recibido (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 rounded-lg text-sm border"
                    style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    value={state.depositAmount}
                    onChange={e => set('depositAmount', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notas</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  value={state.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Observaciones, preferencias..."
                />
              </div>
            </div>
          )}

          {/* STEP: CONFIRMATION */}
          {step === 'confirmation' && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                <Row label="Huésped" value={state.guest?.full_name ?? '—'} />
                {state.company && <Row label="Empresa" value={state.company.name} />}
                <Row label="Llegada" value={state.startDate} />
                <Row label="Salida" value={state.endDate} />
                <Row label="Noches" value={String(nights)} />
                <Row label="Precio total" value={`$${Number(state.agreedPrice).toLocaleString('es-CO')}`} />
                {state.depositAmount && <Row label="Depósito" value={`$${Number(state.depositAmount).toLocaleString('es-CO')}`} />}
                {state.notes && <Row label="Notas" value={state.notes} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
            style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            <ChevronLeft size={16} /> Atrás
          </button>

          {step !== 'confirmation' ? (
            <button
              onClick={next}
              disabled={!canAdvance()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--color-primary)' }}
            >
              <CheckCircle size={16} />
              {isCreating ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function addDays(date: string, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
