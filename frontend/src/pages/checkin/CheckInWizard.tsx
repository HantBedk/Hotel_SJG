import { useState, useRef } from 'react'
import {
  X, ChevronRight, ChevronLeft, Search, Plus, User, Building2,
  CheckCircle, Minus, Users,
} from 'lucide-react'
import { useGuestSearch } from '@/hooks/useGuests'
import { useCompanySearch } from '@/hooks/useCompanies'
import { useStays } from '@/hooks/useStays'
import { createGuestApi, updateGuestApi, findGuestByDocumentApi } from '@/services/guests.service'
import { createCompanyApi } from '@/services/companies.service'
import type { Room, Guest, Company, GuestCompanion } from '@/types'
import { cn } from '@/lib/cn'
import toast from 'react-hot-toast'

interface Props {
  rooms: Room[]
  onClose: () => void
}

type StepId = 'occupancy' | 'main-guest' | `extra-${number}` | 'company' | 'confirmation'

interface AdditionalGuestForm {
  documentInput: string
  isSearching: boolean
  found: Guest | null
  notFound: boolean
  isEditing: boolean
  editData: { full_name: string; phone: string; email: string; nationality: string }
  newGuest: { full_name: string; document_type: string; document_number: string; phone: string; email: string; nationality: string }
  registered: boolean
}

interface WizardState {
  adults: number
  children: number
  guest: Guest | null
  guestSearch: string
  isNewGuest: boolean
  newGuest: { full_name: string; document_type: string; document_number: string; phone: string; email: string; nationality: string }
  companions: Partial<GuestCompanion>[]
  withCompany: boolean
  additionalGuests: AdditionalGuestForm[]
  company: Company | null
  companySearch: string
  isNewCompany: boolean
  newCompany: { name: string; nit: string; phone: string; email: string; contact_name: string }
  checkInDate: string
  checkOutDate: string
  prices: Record<string, string>
  notes: string
}

const DOCUMENT_TYPES = [
  { value: 'cc',       label: 'Cédula de ciudadanía' },
  { value: 'ce',       label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
]

function makeExtraForm(): AdditionalGuestForm {
  return {
    documentInput: '',
    isSearching: false,
    found: null,
    notFound: false,
    isEditing: false,
    editData: { full_name: '', phone: '', email: '', nationality: '' },
    newGuest: { full_name: '', document_type: 'cc', document_number: '', phone: '', email: '', nationality: '' },
    registered: false,
  }
}

function buildSteps(state: WizardState): StepId[] {
  const pending = Math.max(0, state.adults + state.children - 1)
  const extra = Array.from({ length: pending }, (_, i) => `extra-${i}` as StepId)
  return [
    'occupancy',
    'main-guest',
    ...extra,
    ...(state.withCompany ? ['company' as StepId] : []),
    'confirmation',
  ]
}

function extraIndex(step: StepId): number {
  const m = step.match(/^extra-(\d+)$/)
  return m ? parseInt(m[1], 10) : -1
}

function toISOLocal(dateStr: string): string {
  return new Date(dateStr).toISOString()
}

function nightCount(from: string, to: string): number {
  if (!from || !to) return 0
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000))
}

const inputCls = 'px-3 py-2 rounded-lg text-sm border outline-none'
const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }

export default function CheckInWizard({ rooms, onClose }: Props) {
  const now       = new Date()
  const tomorrow  = new Date(now.getTime() + 86400000)
  const localNow  = now.toISOString().slice(0, 16)
  const localTom  = tomorrow.toISOString().slice(0, 10)

  const [currentStep, setCurrentStep] = useState<StepId>('occupancy')
  const [state, setState] = useState<WizardState>({
    adults: 1, children: 0,
    guest: null, guestSearch: '', isNewGuest: false,
    newGuest: { full_name: '', document_type: 'cc', document_number: '', phone: '', email: '', nationality: '' },
    companions: [],
    withCompany: false, additionalGuests: [],
    company: null, companySearch: '', isNewCompany: false,
    newCompany: { name: '', nit: '', phone: '', email: '', contact_name: '' },
    checkInDate: localNow, checkOutDate: localTom,
    prices: Object.fromEntries(rooms.map((r) => [r.id, r.room_type.base_price])),
    notes: '',
  })

  const guestInputRef = useRef<HTMLInputElement>(null)
  const { data: guestResults = [] } = useGuestSearch(state.guestSearch)
  const { data: companyResults = [] } = useCompanySearch(state.companySearch)
  const { checkIn, isCheckingIn } = useStays()

  const steps     = buildSteps(state)
  const currentIdx = steps.indexOf(currentStep)
  const isFirst   = currentIdx === 0
  const isLast    = currentIdx === steps.length - 1
  const nights    = nightCount(state.checkInDate, state.checkOutDate)

  const totalEstimated = rooms.reduce((sum, r) => {
    return sum + parseFloat(state.prices[r.id] ?? r.room_type.base_price) * nights
  }, 0)

  // ── Occupancy sync ─────────────────────────────────────────────────────────

  const syncAdditionalForms = (adults: number, children: number) => {
    const needed = Math.max(0, adults + children - 1)
    setState((s) => {
      if (s.additionalGuests.length === needed) return s
      if (s.additionalGuests.length < needed) {
        const extra = Array.from({ length: needed - s.additionalGuests.length }, makeExtraForm)
        return { ...s, additionalGuests: [...s.additionalGuests, ...extra] }
      }
      return { ...s, additionalGuests: s.additionalGuests.slice(0, needed) }
    })
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  const navigateNext = () => {
    if (currentStep === 'occupancy') syncAdditionalForms(state.adults, state.children)
    const next = steps[currentIdx + 1]
    if (next) setCurrentStep(next)
  }

  const navigatePrev = () => {
    const prev = steps[currentIdx - 1]
    if (prev) setCurrentStep(prev)
  }

  // ── Validators ─────────────────────────────────────────────────────────────

  const isMainGuestValid = state.isNewGuest
    ? (state.newGuest.full_name.trim() !== '' && state.newGuest.document_number.trim() !== '')
    : state.guest !== null

  const isCompanyValid = !state.withCompany
    ? true
    : state.isNewCompany
      ? state.newCompany.name.trim() !== ''
      : state.company !== null

  const isConfirmValid = state.checkInDate !== '' && state.checkOutDate !== '' && nights >= 1

  function canAdvance(step: StepId): boolean {
    if (step === 'occupancy')    return state.adults >= 1
    if (step === 'main-guest')   return isMainGuestValid
    if (step === 'company')      return isCompanyValid
    if (step === 'confirmation') return isConfirmValid
    const idx = extraIndex(step)
    return idx >= 0 ? (state.additionalGuests[idx]?.registered ?? false) : false
  }

  // ── Additional guest helpers ───────────────────────────────────────────────

  const setExtra = (idx: number, patch: Partial<AdditionalGuestForm>) =>
    setState((s) => ({
      ...s,
      additionalGuests: s.additionalGuests.map((ag, i) => i === idx ? { ...ag, ...patch } : ag),
    }))

  const searchByDoc = async (idx: number, doc: string) => {
    if (!doc.trim()) return
    setExtra(idx, { isSearching: true, found: null, notFound: false, registered: false })
    try {
      const guest = await findGuestByDocumentApi(doc.trim())
      if (guest) {
        setExtra(idx, {
          isSearching: false, found: guest, notFound: false,
          editData: {
            full_name:   guest.full_name,
            phone:       guest.phone ?? '',
            email:       guest.email ?? '',
            nationality: guest.nationality ?? '',
          },
        })
      } else {
        setExtra(idx, {
          isSearching: false, found: null, notFound: true,
          newGuest: { ...makeExtraForm().newGuest, document_number: doc.trim() },
        })
      }
    } catch {
      setExtra(idx, {
        isSearching: false, found: null, notFound: true,
        newGuest: { ...makeExtraForm().newGuest, document_number: doc.trim() },
      })
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

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

      const additionalGuestIds: string[] = []
      for (const ag of state.additionalGuests) {
        if (ag.found) {
          if (ag.isEditing) await updateGuestApi(ag.found.id, ag.editData)
          additionalGuestIds.push(ag.found.id)
        } else if (ag.notFound) {
          const created = await createGuestApi(ag.newGuest)
          additionalGuestIds.push(created.id)
        }
      }

      let companyId = state.company?.id
      if (state.withCompany && state.isNewCompany && state.newCompany.name) {
        const created = await createCompanyApi(state.newCompany as Parameters<typeof createCompanyApi>[0])
        companyId = created.id
      }

      await checkIn({
        guest_id:             guestId!,
        company_id:           companyId,
        room_ids:             rooms.map((r) => r.id),
        check_in_datetime:    toISOLocal(state.checkInDate),
        check_out_datetime:   toISOLocal(state.checkOutDate + (state.checkOutDate.length === 10 ? 'T12:00' : '')),
        prices:               Object.fromEntries(Object.entries(state.prices).map(([k, v]) => [k, parseFloat(v)])),
        notes:                state.notes || undefined,
        additional_guest_ids: additionalGuestIds.length > 0 ? additionalGuestIds : undefined,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el check-in'
      toast.error(msg)
    }
  }

  // ── Step renders ───────────────────────────────────────────────────────────

  const renderOccupancy = () => (
    <div className="space-y-5">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        PASO 1 — OCUPACIÓN DE LA HABITACIÓN
      </p>

      {(['adults', 'children'] as const).map((key) => (
        <div
          key={key}
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {key === 'adults' ? 'Adultos' : 'Niños'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {key === 'adults' ? '13 años o más' : 'Menores de 13 años'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setState((s) => ({ ...s, [key]: key === 'adults' ? Math.max(1, s.adults - 1) : Math.max(0, s.children - 1) }))
              }
              disabled={state[key] <= (key === 'adults' ? 1 : 0)}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-opacity disabled:opacity-30"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {state[key]}
            </span>
            <button
              onClick={() => setState((s) => ({ ...s, [key]: s[key] + 1 }))}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-opacity"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className="p-3 rounded-lg text-sm space-y-0.5" style={{ background: 'var(--bg-input)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Users size={14} />
          <span>
            Total:{' '}
            <strong>{state.adults + state.children}</strong>{' '}
            huésped{state.adults + state.children !== 1 ? 'es' : ''}
          </span>
        </div>
        {state.adults + state.children > 1 && (
          <p className="text-xs pl-5" style={{ color: 'var(--text-muted)' }}>
            El titular se registra en el paso siguiente. Se generarán{' '}
            <strong>{state.adults + state.children - 1}</strong> formulario
            {state.adults + state.children - 1 !== 1 ? 's' : ''} adicional
            {state.adults + state.children - 1 !== 1 ? 'es' : ''}.
          </p>
        )}
      </div>
    </div>
  )

  const renderMainGuest = () => (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        TITULAR DE LA RESERVA
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
              className={cn('w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none')}
              style={inputStyle}
            />
          </div>

          {guestResults.length > 0 && !state.guest && (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
              {guestResults.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setState((s) => ({ ...s, guest: g, guestSearch: g.full_name }))}
                  className="w-full text-left px-3 py-2 text-sm hover:opacity-80 border-b last:border-b-0"
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
                className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}
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
                className={cn('w-full', inputCls)} style={inputStyle}
              />
            </div>
            <select
              value={state.newGuest.document_type}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, document_type: e.target.value } }))}
              className={inputCls} style={inputStyle}
            >
              {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input
              placeholder="Número de documento *"
              value={state.newGuest.document_number}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, document_number: e.target.value } }))}
              className={inputCls} style={inputStyle}
            />
            <input
              placeholder="Teléfono"
              value={state.newGuest.phone}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, phone: e.target.value } }))}
              className={inputCls} style={inputStyle}
            />
            <input
              placeholder="Email"
              value={state.newGuest.email}
              onChange={(e) => setState((s) => ({ ...s, newGuest: { ...s.newGuest, email: e.target.value } }))}
              className={inputCls} style={inputStyle}
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
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ACOMPAÑANTES (OPCIONAL)</p>
          <button
            onClick={() => setState((s) => ({ ...s, companions: [...s.companions, { name: '', document_type: 'cc', relationship: '' }] }))}
            className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
        {state.companions.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Nombre"
              value={c.name ?? ''}
              onChange={(e) => setState((s) => ({
                ...s,
                companions: s.companions.map((comp, idx) => idx === i ? { ...comp, name: e.target.value } : comp),
              }))}
              className={cn('flex-1', inputCls)} style={{ ...inputStyle, padding: '6px 12px' }}
            />
            <input
              placeholder="Parentesco"
              value={c.relationship ?? ''}
              onChange={(e) => setState((s) => ({
                ...s,
                companions: s.companions.map((comp, idx) => idx === i ? { ...comp, relationship: e.target.value } : comp),
              }))}
              className={cn('w-28', inputCls)} style={{ ...inputStyle, padding: '6px 12px' }}
            />
            <button
              onClick={() => setState((s) => ({ ...s, companions: s.companions.filter((_, idx) => idx !== i) }))}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

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

  const renderExtraGuest = (idx: number) => {
    const ag = state.additionalGuests[idx]
    if (!ag) return null

    const total     = state.adults + state.children
    const guestNum  = idx + 2
    const newFormOk = ag.newGuest.full_name.trim() !== '' && ag.newGuest.document_number.trim() !== ''

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            HUÉSPED {guestNum} DE {total}
          </p>
          {ag.registered && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--status-available)' }}>
              <CheckCircle size={12} /> Registrado
            </span>
          )}
        </div>

        {ag.registered ? (
          /* ── Registered state ── */
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#ECFDF5', border: '1px solid var(--status-available)' }}>
              <CheckCircle size={18} style={{ color: 'var(--status-available)' }} />
              <div>
                {ag.found ? (
                  <>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {ag.isEditing ? ag.editData.full_name : ag.found.full_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {ag.found.document_type.toUpperCase()} {ag.found.document_number}
                      {ag.isEditing && ag.editData.phone ? ` · ${ag.editData.phone}` : ag.found.phone ? ` · ${ag.found.phone}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{ag.newGuest.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {ag.newGuest.document_type.toUpperCase()} {ag.newGuest.document_number}
                      <span className="ml-1" style={{ color: 'var(--color-primary)' }}>· Nuevo</span>
                    </p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setExtra(idx, { registered: false })}
              className="text-xs" style={{ color: 'var(--text-muted)' }}
            >
              Editar
            </button>
          </div>
        ) : (
          <>
            {/* ── Document search phase ── */}
            {!ag.found && !ag.notFound && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ingresa el número de documento para verificar si ya existe en el sistema.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Número de documento"
                    value={ag.documentInput}
                    onChange={(e) => setExtra(idx, { documentInput: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') searchByDoc(idx, ag.documentInput) }}
                    className={cn('flex-1', inputCls)} style={inputStyle}
                  />
                  <button
                    onClick={() => searchByDoc(idx, ag.documentInput)}
                    disabled={ag.isSearching || !ag.documentInput.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    {ag.isSearching ? '…' : 'Buscar'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Found existing guest ── */}
            {ag.found && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg space-y-2" style={{ background: '#ECFDF5', border: '1px solid var(--status-available)' }}>
                  <div className="flex items-center gap-2">
                    <User size={16} style={{ color: 'var(--status-available)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--status-available)' }}>Huésped encontrado</span>
                  </div>
                  {ag.isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Nombre completo"
                        value={ag.editData.full_name}
                        onChange={(e) => setExtra(idx, { editData: { ...ag.editData, full_name: e.target.value } })}
                        className={cn('col-span-2', inputCls)} style={{ ...inputStyle, padding: '6px 12px' }}
                      />
                      <input
                        placeholder="Teléfono"
                        value={ag.editData.phone}
                        onChange={(e) => setExtra(idx, { editData: { ...ag.editData, phone: e.target.value } })}
                        className={inputCls} style={{ ...inputStyle, padding: '6px 12px' }}
                      />
                      <input
                        placeholder="Email"
                        value={ag.editData.email}
                        onChange={(e) => setExtra(idx, { editData: { ...ag.editData, email: e.target.value } })}
                        className={inputCls} style={{ ...inputStyle, padding: '6px 12px' }}
                      />
                      <input
                        placeholder="Nacionalidad"
                        value={ag.editData.nationality}
                        onChange={(e) => setExtra(idx, { editData: { ...ag.editData, nationality: e.target.value } })}
                        className={cn('col-span-2', inputCls)} style={{ ...inputStyle, padding: '6px 12px' }}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{ag.found.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {ag.found.document_type.toUpperCase()} {ag.found.document_number}
                        {ag.found.phone && ` · ${ag.found.phone}`}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExtra(idx, { registered: true })}
                    className="flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setExtra(idx, { isEditing: !ag.isEditing })}
                    className="px-4 py-2 rounded-lg text-sm border"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
                  >
                    {ag.isEditing ? 'Cancelar' : 'Editar'}
                  </button>
                  <button
                    onClick={() => setExtra(idx, { found: null, notFound: false, documentInput: '', isEditing: false })}
                    className="px-3 py-2 rounded-lg text-sm border"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            {/* ── Not found — new guest form ── */}
            {ag.notFound && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Documento no encontrado. Completa los datos.
                  </p>
                  <button
                    onClick={() => setExtra(idx, { notFound: false, documentInput: '' })}
                    className="text-xs" style={{ color: 'var(--text-muted)' }}
                  >
                    ← Buscar otro
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      placeholder="Nombre completo *"
                      value={ag.newGuest.full_name}
                      onChange={(e) => setExtra(idx, { newGuest: { ...ag.newGuest, full_name: e.target.value } })}
                      className={cn('w-full', inputCls)} style={inputStyle}
                    />
                  </div>
                  <select
                    value={ag.newGuest.document_type}
                    onChange={(e) => setExtra(idx, { newGuest: { ...ag.newGuest, document_type: e.target.value } })}
                    className={inputCls} style={inputStyle}
                  >
                    {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  <input
                    placeholder="Número de documento *"
                    value={ag.newGuest.document_number}
                    onChange={(e) => setExtra(idx, { newGuest: { ...ag.newGuest, document_number: e.target.value } })}
                    className={inputCls} style={inputStyle}
                  />
                  <input
                    placeholder="Teléfono"
                    value={ag.newGuest.phone}
                    onChange={(e) => setExtra(idx, { newGuest: { ...ag.newGuest, phone: e.target.value } })}
                    className={inputCls} style={inputStyle}
                  />
                  <input
                    placeholder="Email"
                    value={ag.newGuest.email}
                    onChange={(e) => setExtra(idx, { newGuest: { ...ag.newGuest, email: e.target.value } })}
                    className={inputCls} style={inputStyle}
                  />
                </div>
                <button
                  onClick={() => { if (newFormOk) setExtra(idx, { registered: true }) }}
                  disabled={!newFormOk}
                  className={cn('w-full py-2 rounded-lg text-sm font-medium transition-opacity', !newFormOk && 'opacity-40 cursor-not-allowed')}
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  Registrar huésped
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderCompany = () => (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        EMPRESA
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
              className={cn('w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none')}
              style={inputStyle}
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
              <button
                className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}
                onClick={() => setState((s) => ({ ...s, company: null, companySearch: '' }))}
              >
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
                className={cn('w-full', inputCls)} style={inputStyle}
              />
            </div>
            <input
              placeholder="NIT *"
              value={state.newCompany.nit}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, nit: e.target.value } }))}
              className={inputCls} style={inputStyle}
            />
            <input
              placeholder="Teléfono"
              value={state.newCompany.phone}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, phone: e.target.value } }))}
              className={inputCls} style={inputStyle}
            />
            <input
              placeholder="Email"
              value={state.newCompany.email}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, email: e.target.value } }))}
              className={inputCls} style={inputStyle}
            />
            <input
              placeholder="Persona de contacto"
              value={state.newCompany.contact_name}
              onChange={(e) => setState((s) => ({ ...s, newCompany: { ...s.newCompany, contact_name: e.target.value } }))}
              className={cn('col-span-2', inputCls)} style={inputStyle}
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

  const renderConfirmation = () => {
    const mainName = state.isNewGuest ? state.newGuest.full_name : (state.guest?.full_name ?? '—')
    const totalGuests = state.adults + state.children
    const registeredAdditional = state.additionalGuests.filter((ag) => ag.registered)
    const allRegistered = registeredAdditional.length === state.additionalGuests.length

    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          CONFIRMACIÓN
        </p>

        {/* Guest summary */}
        <div className="p-3 rounded-lg text-sm space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Habitación{rooms.length > 1 ? 'es' : ''}</span>
            <span style={{ color: 'var(--text-primary)' }}>{rooms.map((r) => `Hab. ${r.number}`).join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Total huéspedes</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {totalGuests} ({state.adults} adulto{state.adults !== 1 ? 's' : ''}{state.children > 0 ? `, ${state.children} niño${state.children !== 1 ? 's' : ''}` : ''})
            </span>
          </div>
          <div className="border-t pt-2 space-y-1" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <User size={12} />
              <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>{mainName}</span>
              <span>titular</span>
            </div>
            {state.additionalGuests.map((ag, i) => {
              const name = ag.found ? (ag.isEditing ? ag.editData.full_name : ag.found.full_name) : ag.newGuest.full_name
              return (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <User size={12} />
                  <span className="flex-1" style={{ color: name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {name || `Huésped ${i + 2}`}
                  </span>
                  {ag.registered ? (
                    <CheckCircle size={11} style={{ color: 'var(--status-available)' }} />
                  ) : (
                    <span style={{ color: 'var(--color-warning, #F59E0B)' }}>pendiente</span>
                  )}
                </div>
              )
            })}
          </div>
          {!allRegistered && state.additionalGuests.length > 0 && (
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-warning, #F59E0B)' }}>
              {state.additionalGuests.length - registeredAdditional.length} huésped
              {state.additionalGuests.length - registeredAdditional.length !== 1 ? 'es' : ''} pendiente
              {state.additionalGuests.length - registeredAdditional.length !== 1 ? 's' : ''} de registrar.
            </p>
          )}
          {state.company && (
            <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--border-default)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Empresa</span>
              <span style={{ color: 'var(--text-primary)' }}>{state.company.name}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Entrada</label>
            <input
              type="datetime-local"
              value={state.checkInDate}
              onChange={(e) => setState((s) => ({ ...s, checkInDate: e.target.value }))}
              className={cn('w-full', inputCls)} style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Salida prevista</label>
            <input
              type="date"
              value={state.checkOutDate}
              onChange={(e) => setState((s) => ({ ...s, checkOutDate: e.target.value }))}
              className={cn('w-full', inputCls)} style={inputStyle}
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
                style={inputStyle}
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
          style={inputStyle}
        />
      </div>
    )
  }

  // ── Render current step ────────────────────────────────────────────────────

  function renderStep() {
    if (currentStep === 'occupancy')    return renderOccupancy()
    if (currentStep === 'main-guest')   return renderMainGuest()
    if (currentStep === 'company')      return renderCompany()
    if (currentStep === 'confirmation') return renderConfirmation()
    const idx = extraIndex(currentStep)
    return idx >= 0 ? renderExtraGuest(idx) : null
  }

  const canGoNext = canAdvance(currentStep)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && isFirst) onClose() }}
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
            {/* Progress bar dots */}
            <div className="flex gap-1 mt-2">
              {steps.map((s, i) => (
                <span
                  key={s}
                  className="h-1.5 rounded-full transition-all duration-200"
                  style={{
                    width: s === currentStep ? '18px' : '6px',
                    background: i <= currentIdx ? 'var(--color-primary)' : 'var(--border-default)',
                  }}
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
          {renderStep()}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-4 border-t gap-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {!isFirst ? (
            <button
              onClick={navigatePrev}
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

          {!isLast ? (
            <button
              disabled={!canGoNext}
              onClick={navigateNext}
              className={cn(
                'flex items-center gap-1 text-sm px-5 py-2 rounded-lg font-medium transition-opacity',
                !canGoNext && 'opacity-40 cursor-not-allowed',
              )}
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              disabled={!isConfirmValid || isCheckingIn}
              onClick={handleConfirm}
              className={cn(
                'flex items-center gap-2 text-sm px-5 py-2 rounded-lg font-medium transition-opacity',
                (!isConfirmValid || isCheckingIn) && 'opacity-40 cursor-not-allowed',
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
