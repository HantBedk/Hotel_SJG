import { useState } from 'react'
import {
  X, ChevronRight, ChevronLeft, Search, User, Building2,
  CheckCircle, UserPlus, BedDouble,
} from 'lucide-react'
import { useGuestSearch } from '@/hooks/useGuests'
import { useCompanySearch } from '@/hooks/useCompanies'
import { useRooms } from '@/hooks/useRooms'
import { useReservations } from '@/hooks/useReservations'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { createGuestApi } from '@/services/guests.service'
import { extractApiError } from '@/lib/apiError'
import type { Guest, Company, Room, DocumentType } from '@/types'

interface Props {
  prefillStartDate?: string
  prefillRoom?: Room
  onClose: () => void
  onSuccess?: () => void
}

type StepId = 'guest' | 'room' | 'company' | 'dates' | 'confirmation'

const STEPS: StepId[] = ['guest', 'room', 'company', 'dates', 'confirmation']
const STEP_LABELS: Record<StepId, string> = {
  guest:        'Huésped',
  room:         'Habitación',
  company:      'Empresa',
  dates:        'Fechas y precio',
  confirmation: 'Confirmación',
}

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'cc',       label: 'Cédula (CC)' },
  { value: 'ce',       label: 'Cédula extranjería (CE)' },
  { value: 'passport', label: 'Pasaporte' },
]

interface NewGuestForm {
  full_name:       string
  document_type:   DocumentType
  document_number: string
  email:           string
  phone:           string
  nationality:     string
}

interface WizardState {
  guest:         Guest | null
  guestSearch:   string
  withCompany:   boolean
  company:       Company | null
  companySearch: string
  room:          Room | null
  startDate:     string
  endDate:       string
  agreedPrice:   string
  depositAmount: string
  notes:         string
}

function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000))
}

function addDays(date: string, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmt(n: number) {
  return n.toLocaleString('es-CO')
}

export default function NewReservationWizard({ prefillStartDate, prefillRoom, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [step, setStep]       = useState<StepId>('guest')
  const [state, setState]     = useState<WizardState>({
    guest:         null,
    guestSearch:   '',
    withCompany:   false,
    company:       null,
    companySearch: '',
    room:          prefillRoom ?? null,
    startDate:     prefillStartDate ?? today,
    endDate:       prefillStartDate ? addDays(prefillStartDate, 1) : addDays(today, 1),
    agreedPrice:   prefillRoom ? String(prefillRoom.room_type?.base_price ?? '') : '',
    depositAmount: '',
    notes:         '',
  })

  /* ── New guest form ───────────────────────────────────────────── */
  const [creatingNew, setCreatingNew] = useState(false)
  const [newGuest, setNewGuest]       = useState<NewGuestForm>({
    full_name:       '',
    document_type:   'cc',
    document_number: '',
    email:           '',
    phone:           '',
    nationality:     '',
  })
  const [guestError, setGuestError]   = useState('')
  const [savingGuest, setSavingGuest] = useState(false)

  /* ── Hooks ────────────────────────────────────────────────────── */
  const { create, isCreating }                              = useReservations()
  const { data: guestResults = [], isLoading: guestsLoading } = useGuestSearch(state.guestSearch)
  const { data: companyResults = [], isLoading: companiesLoading } = useCompanySearch(state.companySearch)
  const { rooms: allRooms }                                 = useRooms()

  const availableRooms = (allRooms as Room[]).filter(
    (r) => (r.status === 'available' || r.status === 'reserved') && r.is_active
  )

  const nights    = nightsBetween(state.startDate, state.endDate)
  const stepIndex = STEPS.indexOf(step)

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState(prev => ({ ...prev, [key]: value }))

  const setNG = <K extends keyof NewGuestForm>(key: K, val: NewGuestForm[K]) =>
    setNewGuest(prev => ({ ...prev, [key]: val }))

  /* ── Navigation ───────────────────────────────────────────────── */
  const canAdvance = (): boolean => {
    switch (step) {
      case 'guest':
        if (creatingNew) {
          return !!newGuest.full_name.trim() && !!newGuest.document_number.trim()
        }
        return !!state.guest
      case 'room':         return !!state.room
      case 'company':      return true
      case 'dates':        return !!state.startDate && !!state.endDate && nights > 0 && !!state.agreedPrice && Number(state.agreedPrice) >= 0
      case 'confirmation': return true
    }
  }

  const next = async () => {
    if (step === 'guest' && creatingNew) {
      setSavingGuest(true)
      setGuestError('')
      try {
        const created = await createGuestApi({
          full_name:       newGuest.full_name.trim(),
          document_type:   newGuest.document_type,
          document_number: newGuest.document_number.trim(),
          email:           newGuest.email.trim() || undefined,
          phone:           newGuest.phone.trim() || undefined,
          nationality:     newGuest.nationality.trim() || undefined,
        })
        set('guest', created)
        setCreatingNew(false)
        setStep(STEPS[stepIndex + 1])
      } catch (err) {
        setGuestError(extractApiError(err, 'Error al crear huésped.'))
      } finally {
        setSavingGuest(false)
      }
      return
    }
    setStep(STEPS[stepIndex + 1])
  }

  const prev = () => setStep(STEPS[stepIndex - 1])

  const handleConfirm = async () => {
    await create({
      guest_id:       state.guest?.id,
      room_id:        state.room?.id,
      company_id:     state.company?.id,
      start_date:     state.startDate,
      end_date:       state.endDate,
      agreed_price:   Number(state.agreedPrice),
      deposit_amount: state.depositAmount ? Number(state.depositAmount) : undefined,
      notes:          state.notes || undefined,
    })
    onSuccess?.()
  }

  /* ── Helpers ──────────────────────────────────────────────────── */
  const selectRoom = (room: Room) => {
    set('room', room)
    if (!state.agreedPrice && room.room_type?.base_price) {
      set('agreedPrice', String(room.room_type.base_price))
    }
  }

  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nueva reserva"
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
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
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

          {/* ── STEP: HUÉSPED ─────────────────────────────────────── */}
          {step === 'guest' && (
            <div className="space-y-3">
              {/* Guest already selected */}
              {state.guest && !creatingNew && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-main)', border: '2px solid var(--color-primary)' }}>
                  <User size={16} style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{state.guest.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.guest.document_number}</p>
                  </div>
                  <button onClick={() => set('guest', null)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>
              )}

              {/* Search mode */}
              {!state.guest && !creatingNew && (
                <>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Buscar huésped existente
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      placeholder="Nombre o documento..."
                      value={state.guestSearch}
                      onChange={e => set('guestSearch', e.target.value)}
                      autoFocus
                    />
                  </div>

                  {state.guestSearch.length > 1 && (
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                      {guestsLoading ? (
                        <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
                      ) : (guestResults as Guest[]).length === 0 ? (
                        <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>
                      ) : (
                        (guestResults as Guest[]).slice(0, 6).map((g) => (
                          <button
                            key={g.id}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 border-b last:border-0"
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

                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>o</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
                    </div>
                    <button
                      onClick={() => setCreatingNew(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm border transition-opacity hover:opacity-80"
                      style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                    >
                      <UserPlus size={15} /> Registrar nuevo huésped
                    </button>
                  </div>
                </>
              )}

              {/* Create new guest form */}
              {creatingNew && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nuevo huésped</p>
                    <button
                      onClick={() => { setCreatingNew(false); setGuestError('') }}
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ← Volver a buscar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nombre completo *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      placeholder="Juan Pérez García"
                      value={newGuest.full_name}
                      onChange={e => setNG('full_name', e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tipo de documento *</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        value={newGuest.document_type}
                        onChange={e => setNG('document_type', e.target.value as DocumentType)}
                      >
                        {DOC_TYPES.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Número de documento *</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        placeholder="123456789"
                        value={newGuest.document_number}
                        onChange={e => setNG('document_number', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Teléfono</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        placeholder="+57 300..."
                        value={newGuest.phone}
                        onChange={e => setNG('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nacionalidad</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        placeholder="Colombiana"
                        value={newGuest.nationality}
                        onChange={e => setNG('nationality', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      placeholder="correo@ejemplo.com"
                      value={newGuest.email}
                      onChange={e => setNG('email', e.target.value)}
                    />
                  </div>

                  {guestError && (
                    <p className="text-xs text-red-500">{guestError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: HABITACIÓN ──────────────────────────────────── */}
          {step === 'room' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Seleccionar habitación
              </label>

              {state.room && (
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--bg-main)', border: '2px solid var(--color-primary)' }}
                >
                  <BedDouble size={16} style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Hab. {state.room.number}
                      {state.room.room_type?.name ? ` · ${state.room.room_type.name}` : ''}
                    </p>
                    {state.room.room_type?.base_price && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        ${fmt(Number(state.room.room_type.base_price))} / noche
                      </p>
                    )}
                  </div>
                  <button onClick={() => set('room', null)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>
              )}

              {!state.room && (
                availableRooms.length === 0 ? (
                  <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                    No hay habitaciones disponibles.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {availableRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => selectRoom(room)}
                        className="flex flex-col gap-1 p-3 rounded-lg text-left border transition-all hover:opacity-80"
                        style={{
                          borderColor: 'var(--border-default)',
                          background: 'var(--bg-main)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <BedDouble size={14} style={{ color: 'var(--color-primary)' }} />
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Hab. {room.number}
                          </span>
                        </div>
                        {room.room_type?.name && (
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {room.room_type.name}
                          </span>
                        )}
                        {room.room_type?.base_price && (
                          <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                            ${fmt(Number(room.room_type.base_price))} / noche
                          </span>
                        )}
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full self-start"
                          style={{
                            background: room.status === 'available' ? '#dcfce7' : '#fef9c3',
                            color: room.status === 'available' ? '#16a34a' : '#ca8a04',
                          }}
                        >
                          {room.status === 'available' ? 'Disponible' : 'Reservada'}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── STEP: EMPRESA ─────────────────────────────────────── */}
          {step === 'company' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
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
                      autoFocus
                    />
                  </div>

                  {state.company && (
                    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-main)', border: '2px solid var(--color-primary)' }}>
                      <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{state.company.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.company.nit}</p>
                      </div>
                      <button onClick={() => set('company', null)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                    </div>
                  )}

                  {!state.company && state.companySearch.length > 1 && (
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                      {companiesLoading ? (
                        <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
                      ) : (companyResults as Company[]).length === 0 ? (
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

          {/* ── STEP: FECHAS Y PRECIO ─────────────────────────────── */}
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
                      if (e.target.value >= state.endDate) set('endDate', addDays(e.target.value, 1))
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Precio acordado (total)
                </label>
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
                {state.room?.room_type?.base_price && nights > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Sugerido: ${fmt(Number(state.room.room_type.base_price) * nights)} ({nights} noches × ${fmt(Number(state.room.room_type.base_price))})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Depósito recibido <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
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

          {/* ── STEP: CONFIRMACIÓN ────────────────────────────────── */}
          {step === 'confirmation' && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
                <Row label="Huésped"    value={state.guest?.full_name ?? '—'} />
                {state.guest?.document_number && (
                  <Row label="Documento" value={state.guest.document_number} />
                )}
                {state.room && (
                  <Row
                    label="Habitación"
                    value={`Hab. ${state.room.number}${state.room.room_type?.name ? ` · ${state.room.room_type.name}` : ''}`}
                  />
                )}
                {state.company && <Row label="Empresa"  value={state.company.name} />}
                <Row label="Llegada"   value={state.startDate} />
                <Row label="Salida"    value={state.endDate} />
                <Row label="Noches"    value={String(nights)} />
                <Row label="Precio total" value={`$${fmt(Number(state.agreedPrice))}`} highlight />
                {state.depositAmount && (
                  <Row label="Depósito" value={`$${fmt(Number(state.depositAmount))}`} />
                )}
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
              disabled={!canAdvance() || savingGuest}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}
            >
              {savingGuest ? 'Guardando...' : 'Siguiente'} <ChevronRight size={16} />
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

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className={highlight ? 'font-bold' : 'font-medium'}
        style={{ color: highlight ? 'var(--color-primary)' : 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}
