import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Search, Plus, User, Building2, CheckCircle } from 'lucide-react'
import { useGuestSearch } from '@/hooks/useGuests'
import { useCompanySearch } from '@/hooks/useCompanies'
import { useStays } from '@/hooks/useStays'
import { createGuestApi } from '@/services/guests.service'
import { createCompanyApi } from '@/services/companies.service'
import type { Room, Guest, Company, GuestCompanion } from '@/types'
import { cn } from '@/lib/cn'

interface Props {
  rooms: Room[]
  onClose: () => void
}

interface WizardState {
  // Step 1
  guest: Guest | null
  guestSearch: string
  newGuest: { full_name: string; document_type: string; document_number: string; phone: string; email: string; nationality: string }
  companions: Partial<GuestCompanion>[]
  isNewGuest: boolean
  // Step 2
  withCompany: boolean
  company: Company | null
  companySearch: string
  newCompany: { name: string; nit: string; phone: string; email: string; contact_name: string }
  isNewCompany: boolean
  // Step 3
  checkInDate: string
  checkOutDate: string
  prices: Record<string, string>
  notes: string
}

const DOCUMENT_TYPES = [
  { value: 'cc',       label: 'Cédula de ciudadanía' },
  { value: 'ce',       label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'nit',      label: 'NIT' },
]

function toISOLocal(dateStr: string): string {
  return new Date(dateStr).toISOString()
}

function nightCount(from: string, to: string): number {
  if (!from || !to) return 0
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(diff / 86400000))
}

export default function CheckInWizard({ rooms, onClose }: Props) {
  const [step, setStep] = useState(1)
  const guestInputRef = useRef<HTMLInputElement>(null)

  const now    = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)
  const localNow      = now.toISOString().slice(0, 16)
  const localTomorrow = tomorrow.toISOString().slice(0, 10)

  const [state, setState] = useState<WizardState>({
    guest: null, guestSearch: '', isNewGuest: false,
    newGuest: { full_name: '', document_type: 'cc', document_number: '', phone: '', email: '', nationality: '' },
    companions: [],
    withCompany: false, company: null, companySearch: '', isNewCompany: false,
    newCompany: { name: '', nit: '', phone: '', email: '', contact_name: '' },
    checkInDate:  localNow,
    checkOutDate: localTomorrow,
    prices: Object.fromEntries(rooms.map((r) => [r.id, r.room_type.base_price])),
    notes: '',
  })

  const { data: guestResults = [] } = useGuestSearch(state.guestSearch)
  const { data: companyResults = [] } = useCompanySearch(state.companySearch)
  const { checkIn, isCheckingIn } = useStays()

  useEffect(() => {
    guestInputRef.current?.focus()
  }, [step])

  const nights = nightCount(state.checkInDate, state.checkOutDate)

  const totalEstimated = rooms.reduce((sum, room) => {
    const price = parseFloat(state.prices[room.id] ?? room.room_type.base_price)
    return sum + price * nights
  }, 0)

  const step1Valid = state.isNewGuest
    ? (state.newGuest.full_name.trim() !== '' && state.newGuest.document_number.trim() !== '')
    : state.guest !== null

  const step2Valid = !state.withCompany || state.isNewCompany
    ? (!state.withCompany || state.newCompany.name.trim() !== '')
    : state.company !== null

  const step3Valid = state.checkInDate !== '' && state.checkOutDate !== '' && nights >= 1

  const addCompanion = () =>
    setState((s) => ({ ...s, companions: [...s.companions, { name: '', document_type: 'cc', relationship: '' }] }))

  const removeCompanion = (i: number) =>
    setState((s) => ({ ...s, companions: s.companions.filter((_, idx) => idx !== i) }))

  const updateCompanion = (i: number, field: string, value: string) =>
    setState((s) => ({
      ...s,
      companions: s.companions.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
    }))

  const handleConfirm = async () => {
    try {
      let guestId = state.guest?.id

      if (state.isNewGuest) {
        const created = await createGuestApi({
          ...state.newGuest,
          companions: state.companions.filter((c) => c.name?.trim()),
        })
        guestId = created.id
      }

      let companyId: string | undefined = state.company?.id
      if (state.withCompany && state.isNewCompany && state.newCompany.name) {
        const created = await createCompanyApi(state.newCompany as Parameters<typeof createCompanyApi>[0])
        companyId = created.id
      }

      await checkIn({
        guest_id:            guestId!,
        company_id:          companyId,
        room_ids:            rooms.map((r) => r.id),
        check_in_datetime:   toISOLocal(state.checkInDate),
        check_out_datetime:  toISOLocal(state.checkOutDate + (state.checkOutDate.length === 10 ? 'T12:00' : '')),
        prices:              Object.fromEntries(Object.entries(state.prices).map(([k, v]) => [k, parseFloat(v)])),
        notes:               state.notes || undefined,
      })
      onClose()
    } catch {
      // error shown by toast in useStays
    }
  }

  // ── Step content ────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        PASO 1 — HUÉSPED PRINCIPAL
      </p>

      {!state.isNewGuest ? (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={guestInputRef}
              type="text"
              placeholder="Buscar por nombre, documento o teléfono..."
              value={state.guestSearch}
              onChange={(e) => setState((s) => ({ ...s, guestSearch: e.target.value, guest: null }))}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none focus:ring-2"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {guestResults.length > 0 && !state.guest && (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
              {guestResults.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setState((s) => ({ ...s, guest: g, guestSearch: g.full_name }))}
                  className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity border-b last:border-b-0"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                >
                  <span className="font-medium">{g.full_name}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {g.document_type.toUpperCase()} {g.document_number}
                  </span>
                </button>
              ))}
            </div>
          )}

          {state.guest && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#ECFDF5', border: '1px solid var(--status-available)' }}>
              <User size={20} style={{ color: 'var(--status-available)' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{state.guest.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {state.guest.document_type.toUpperCase()} {state.guest.document_number}
                  {state.guest.phone && ` · ${state.guest.phone}`}
                </p>
              </div>
              <button
                className="ml-auto text-xs"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setState((s) => ({ ...s, guest: null, guestSearch: '' }))}
              >
                Cambiar
              </button>
            </div>
          )}

          <button
            onClick={() => setState((s) => ({ ...s, isNewGuest: true, guest: null }))}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Nuevo huésped
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                ref={guestInputRef}
                placeholder="Nombre completo *"
                value={state.newGuest.full_name}
                onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, full_name: e.target.value } }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={state.newGuest.document_type}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, document_type: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            >
              {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input
              placeholder="Número de documento *"
              value={state.newGuest.document_number}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, document_number: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <input
              placeholder="Teléfono"
              value={state.newGuest.phone}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, phone: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <input
              placeholder="Email"
              value={state.newGuest.email}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, email: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={() => setState((s) => ({ ...s, isNewGuest: false }))}
            className="text-xs" style={{ color: 'var(--text-muted)' }}
          >
            ← Buscar huésped existente
          </button>
        </>
      )}

      {/* Companions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ACOMPAÑANTES</p>
          <button onClick={addCompanion} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-primary)' }}>
            <Plus size={12} /> Agregar
          </button>
        </div>
        {state.companions.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Nombre"
              value={c.name ?? ''}
              onChange={(e) => updateCompanion(i, 'name', e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <input
              placeholder="Parentesco"
              value={c.relationship ?? ''}
              onChange={(e) => updateCompanion(i, 'relationship', e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <button onClick={() => removeCompanion(i)} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* With company */}
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
        <input
          type="checkbox"
          checked={state.withCompany}
          onChange={(e) => setState((s) => ({ ...s, withCompany: e.target.checked }))}
          className="rounded"
        />
        Viene por empresa
      </label>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        PASO 2 — EMPRESA
      </p>

      {!state.isNewCompany ? (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={guestInputRef}
              type="text"
              placeholder="Buscar empresa por nombre o NIT..."
              value={state.companySearch}
              onChange={(e) => setState((s) => ({ ...s, companySearch: e.target.value, company: null }))}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          {companyResults.length > 0 && !state.company && (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
              {companyResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setState((s) => ({ ...s, company: c, companySearch: c.name }))}
                  className="w-full text-left px-3 py-2 text-sm hover:opacity-80 border-b last:border-b-0"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>NIT {c.nit}</span>
                </button>
              ))}
            </div>
          )}

          {state.company && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #93C5FD' }}>
              <Building2 size={20} style={{ color: '#3B82F6' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{state.company.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>NIT {state.company.nit}</p>
              </div>
              <button className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}
                onClick={() => setState((s) => ({ ...s, company: null, companySearch: '' }))}>
                Cambiar
              </button>
            </div>
          )}

          <button
            onClick={() => setState((s) => ({ ...s, isNewCompany: true, company: null }))}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Nueva empresa
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                ref={guestInputRef}
                placeholder="Nombre de la empresa *"
                value={state.newCompany.name}
                onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, name: e.target.value } }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <input
              placeholder="NIT *"
              value={state.newCompany.nit}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, nit: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <input
              placeholder="Teléfono"
              value={state.newCompany.phone}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, phone: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <input
              placeholder="Email"
              value={state.newCompany.email}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, email: e.target.value } }))}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <input
              placeholder="Persona de contacto"
              value={state.newCompany.contact_name}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, contact_name: e.target.value } }))}
              className="col-span-2 px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => setState((s) => ({ ...s, isNewCompany: false }))}
            className="text-xs" style={{ color: 'var(--text-muted)' }}
          >
            ← Buscar empresa existente
          </button>
        </>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        PASO 3 — CONFIRMACIÓN
      </p>

      {/* Summary */}
      <div className="p-3 rounded-lg text-sm space-y-1" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Huésped</span>
          <span style={{ color: 'var(--text-primary)' }}>{state.guest?.full_name}</span>
        </div>
        {state.company && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Empresa</span>
            <span style={{ color: 'var(--text-primary)' }}>{state.company.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Habitaciones</span>
          <span style={{ color: 'var(--text-primary)' }}>{rooms.map((r) => r.number).join(', ')}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Entrada</label>
          <input
            type="datetime-local"
            value={state.checkInDate}
            onChange={(e) => setState((s) => ({ ...s, checkInDate: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Salida prevista</label>
          <input
            type="date"
            value={state.checkOutDate}
            onChange={(e) => setState((s) => ({ ...s, checkOutDate: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {nights} {nights === 1 ? 'noche' : 'noches'}
      </p>

      {/* Prices per room */}
      {rooms.map((room) => (
        <div key={room.id} className="flex items-center gap-3">
          <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
            Hab. {room.number} — {room.room_type.name}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>$/noche</span>
            <input
              type="number"
              value={state.prices[room.id] ?? ''}
              onChange={(e) => setState((s) => ({ ...s, prices: { ...s.prices, [room.id]: e.target.value } }))}
              className="w-28 px-2 py-1.5 rounded-lg text-sm border text-right outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total estimado</span>
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          ${totalEstimated.toLocaleString('es-CO')}
        </span>
      </div>

      {/* Notes */}
      <textarea
        placeholder="Observaciones (opcional)"
        value={state.notes}
        onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
      />
    </div>
  )

  const canAdvance = step === 1 ? step1Valid : step === 2 && state.withCompany ? step2Valid : step3Valid

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step <= 1) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Check-in — {rooms.map((r) => `Hab. ${r.number}`).join(', ')}
            </h2>
            <div className="flex gap-1 mt-1.5">
              {[1, ...(state.withCompany ? [2] : []), state.withCompany ? 3 : 2].map((s) => (
                <span
                  key={s}
                  className="w-2 h-2 rounded-full"
                  style={{ background: step >= s ? 'var(--color-primary)' : 'var(--border-default)' }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
            style={{ background: 'var(--bg-input)' }}
            aria-label="Cerrar"
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && renderStep1()}
          {step === 2 && state.withCompany && renderStep2()}
          {(step === 2 && !state.withCompany) || step === 3 ? renderStep3() : null}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-4 border-t gap-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
            >
              Cancelar
            </button>
          )}

          {step < (state.withCompany ? 3 : 2) ? (
            <button
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
              className={cn(
                'flex items-center gap-1 text-sm px-5 py-2 rounded-lg font-medium transition-opacity',
                !canAdvance && 'opacity-40 cursor-not-allowed'
              )}
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              disabled={!step3Valid || isCheckingIn}
              onClick={handleConfirm}
              className={cn(
                'flex items-center gap-2 text-sm px-5 py-2 rounded-lg font-medium transition-opacity',
                (!step3Valid || isCheckingIn) && 'opacity-40 cursor-not-allowed'
              )}
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <CheckCircle size={16} />
              {isCheckingIn ? 'Procesando…' : 'Confirmar Check-in'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
