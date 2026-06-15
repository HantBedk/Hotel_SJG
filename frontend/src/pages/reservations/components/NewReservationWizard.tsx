import { useState, useEffect, type ReactNode } from 'react'
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
import { cn } from '@/lib/cn'
import { PersonNameFieldsInput } from '@/components/person/PersonNameFields'
import { NationalitySelect } from '@/components/person/NationalitySelect'
import { emptyPersonName, isPersonNameValid, type PersonNameFields } from '@/types/person'
import type { Guest, Company, Room, DocumentType } from '@/types'

interface Props {
  readonly prefillStartDate?: string
  readonly prefillRoom?: Room
  readonly onClose: () => void
  readonly onSuccess?: () => void
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
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  document_type:   DocumentType
  document_number: string
  email:           string
  phone:           string
  nationality_id:  string
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
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000))
}

function addDays(date: string, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmt(n: number) {
  return n.toLocaleString('es-CO')
}

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return { dialogRef, backdropClassName }
}

function nightPluralSuffix(n: number): string {
  return n === 1 ? '' : 's'
}

function isAvailableRoom(room: Room): boolean {
  return (room.status === 'available' || room.status === 'reserved') && room.is_active
}

function roomSummaryValue(room: Room): string {
  const typeName = room.room_type?.name
  if (typeName) return `Hab. ${room.number} · ${typeName}`
  return `Hab. ${room.number}`
}

function suggestedPriceHint(room: Room, nights: number): string {
  const basePrice = Number(room.room_type?.base_price ?? 0)
  return `Sugerido: $${fmt(basePrice * nights)} (${nights} noches × $${fmt(basePrice)})`
}

function wizardNextLabel(savingGuest: boolean): string {
  if (savingGuest) return 'Guardando...'
  return 'Siguiente'
}

function wizardConfirmLabel(isCreating: boolean): string {
  if (isCreating) return 'Guardando...'
  return 'Confirmar reserva'
}

function canAdvanceStep(
  step: StepId,
  creatingNew: boolean,
  newGuest: NewGuestForm,
  state: WizardState,
  nights: number,
): boolean {
  switch (step) {
    case 'guest':
      if (creatingNew) {
        return isPersonNameValid(newGuest) && !!newGuest.document_number.trim()
      }
      return !!state.guest
    case 'room':
      return !!state.room
    case 'company':
      return true
    case 'dates':
      return !!state.startDate && !!state.endDate && nights > 0 && !!state.agreedPrice && Number(state.agreedPrice) >= 0
    case 'confirmation':
      return true
  }
}

function guestSearchListContent(
  loading: boolean,
  results: Guest[],
  onSelect: (guest: Guest) => void,
): ReactNode {
  if (loading) {
    return <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
  }
  if (results.length === 0) {
    return <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>
  }
  return results.slice(0, 6).map((g) => (
    <button
      key={g.id}
      type="button"
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 border-b last:border-0"
      style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
      onClick={() => onSelect(g)}
    >
      <User size={14} style={{ color: 'var(--text-muted)' }} />
      <div>
        <p className="text-sm font-medium">{g.full_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.document_number}</p>
      </div>
    </button>
  ))
}

function companySearchListContent(
  loading: boolean,
  results: Company[],
  onSelect: (company: Company) => void,
): ReactNode {
  if (loading) {
    return <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
  }
  if (results.length === 0) {
    return <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>
  }
  return results.slice(0, 5).map((c) => (
    <button
      key={c.id}
      type="button"
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 border-b last:border-0"
      style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
      onClick={() => onSelect(c)}
    >
      <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
      <div>
        <p className="text-sm font-medium">{c.name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.nit}</p>
      </div>
    </button>
  ))
}

interface GuestStepProps {
  readonly state: WizardState
  readonly creatingNew: boolean
  readonly newGuest: NewGuestForm
  readonly guestError: string
  readonly guestsLoading: boolean
  readonly guestResults: Guest[]
  readonly onSetGuest: (guest: Guest | null) => void
  readonly onSetGuestSearch: (value: string) => void
  readonly onSetCreatingNew: (value: boolean) => void
  readonly onSetGuestError: (value: string) => void
  readonly onSetNewGuestField: <K extends keyof NewGuestForm>(key: K, val: NewGuestForm[K]) => void
}

function GuestStep({
  state,
  creatingNew,
  newGuest,
  guestError,
  guestsLoading,
  guestResults,
  onSetGuest,
  onSetGuestSearch,
  onSetCreatingNew,
  onSetGuestError,
  onSetNewGuestField,
}: GuestStepProps) {
  const handleSelectGuest = (guest: Guest) => {
    onSetGuest(guest)
    onSetGuestSearch('')
  }

  return (
    <div className="space-y-3">
      {state.guest && !creatingNew && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-main)', border: '2px solid var(--color-primary)' }}>
          <User size={16} style={{ color: 'var(--color-primary)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{state.guest.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.guest.document_number}</p>
          </div>
          <button type="button" onClick={() => onSetGuest(null)} style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {!state.guest && !creatingNew && (
        <>
          <label htmlFor="wizard-guest-search" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Buscar huésped existente
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              id="wizard-guest-search"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="Nombre o documento..."
              value={state.guestSearch}
              onChange={(e) => onSetGuestSearch(e.target.value)}
              autoFocus
            />
          </div>

          {state.guestSearch.length > 1 && (
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
              {guestSearchListContent(guestsLoading, guestResults, handleSelectGuest)}
            </div>
          )}

          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>o</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
            </div>
            <button
              type="button"
              onClick={() => onSetCreatingNew(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <UserPlus size={15} /> Registrar nuevo huésped
            </button>
          </div>
        </>
      )}

      {creatingNew && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nuevo huésped</p>
            <button
              type="button"
              onClick={() => { onSetCreatingNew(false); onSetGuestError('') }}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              ← Volver a buscar
            </button>
          </div>

          <PersonNameFieldsInput
            value={newGuest}
            onChange={(patch) => {
              for (const key of Object.keys(patch) as Array<keyof PersonNameFields>) {
                const value = patch[key]
                if (value !== undefined) {
                  onSetNewGuestField(key, value)
                }
              }
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="wizard-new-guest-doc-type" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tipo de documento *</label>
              <select
                id="wizard-new-guest-doc-type"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                value={newGuest.document_type}
                onChange={(e) => onSetNewGuestField('document_type', e.target.value as DocumentType)}
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wizard-new-guest-doc-number" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Número de documento *</label>
              <input
                id="wizard-new-guest-doc-number"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                placeholder="123456789"
                value={newGuest.document_number}
                onChange={(e) => onSetNewGuestField('document_number', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="wizard-new-guest-phone" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Teléfono</label>
              <input
                id="wizard-new-guest-phone"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                placeholder="+57 300..."
                value={newGuest.phone}
                onChange={(e) => onSetNewGuestField('phone', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="wizard-new-guest-nationality" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nacionalidad</label>
              <NationalitySelect
                value={newGuest.nationality_id}
                onChange={(nationality_id) => onSetNewGuestField('nationality_id', nationality_id)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="wizard-new-guest-email" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input
              id="wizard-new-guest-email"
              type="email"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="correo@ejemplo.com"
              value={newGuest.email}
              onChange={(e) => onSetNewGuestField('email', e.target.value)}
            />
          </div>

          {guestError && (
            <p className="text-xs text-red-500">{guestError}</p>
          )}
        </div>
      )}
    </div>
  )
}

interface RoomStepProps {
  readonly state: WizardState
  readonly availableRooms: Room[]
  readonly onSelectRoom: (room: Room) => void
  readonly onClearRoom: () => void
}

function RoomStep({ state, availableRooms, onSelectRoom, onClearRoom }: RoomStepProps) {
  let roomPickerContent: ReactNode
  if (availableRooms.length === 0) {
    roomPickerContent = (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        No hay habitaciones disponibles.
      </p>
    )
  } else {
    roomPickerContent = (
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {availableRooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelectRoom(room)}
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
  }

  return (
    <div className="space-y-3">
      <p className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Seleccionar habitación
      </p>

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
          <button type="button" onClick={onClearRoom} style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {!state.room && roomPickerContent}
    </div>
  )
}

interface CompanyStepProps {
  readonly state: WizardState
  readonly companiesLoading: boolean
  readonly companyResults: Company[]
  readonly onSetWithCompany: (value: boolean) => void
  readonly onSetCompany: (company: Company | null) => void
  readonly onSetCompanySearch: (value: string) => void
}

function CompanyStep({
  state,
  companiesLoading,
  companyResults,
  onSetWithCompany,
  onSetCompany,
  onSetCompanySearch,
}: CompanyStepProps) {
  const handleSelectCompany = (company: Company) => {
    onSetCompany(company)
    onSetCompanySearch('')
  }

  return (
    <div className="space-y-3">
      <label htmlFor="wizard-with-company" className="flex items-center gap-2 cursor-pointer select-none">
        <input
          id="wizard-with-company"
          type="checkbox"
          checked={state.withCompany}
          onChange={(e) => {
            onSetWithCompany(e.target.checked)
            if (!e.target.checked) onSetCompany(null)
          }}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Asociar empresa</span>
      </label>

      {state.withCompany && (
        <>
          <div className="relative">
            <label htmlFor="wizard-company-search" className="sr-only">Buscar empresa</label>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              id="wizard-company-search"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="Nombre o NIT..."
              value={state.companySearch}
              onChange={(e) => onSetCompanySearch(e.target.value)}
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
              <button type="button" onClick={() => onSetCompany(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {!state.company && state.companySearch.length > 1 && (
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
              {companySearchListContent(companiesLoading, companyResults, handleSelectCompany)}
            </div>
          )}
        </>
      )}

      {!state.withCompany && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reserva individual sin empresa asociada.</p>
      )}
    </div>
  )
}

interface DatesStepProps {
  readonly state: WizardState
  readonly today: string
  readonly nights: number
  readonly onSetStartDate: (value: string) => void
  readonly onSetEndDate: (value: string) => void
  readonly onSetAgreedPrice: (value: string) => void
  readonly onSetDepositAmount: (value: string) => void
  readonly onSetNotes: (value: string) => void
}

function DatesStep({
  state,
  today,
  nights,
  onSetStartDate,
  onSetEndDate,
  onSetAgreedPrice,
  onSetDepositAmount,
  onSetNotes,
}: DatesStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="wizard-start-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Llegada</label>
          <input
            id="wizard-start-date"
            type="date"
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            value={state.startDate}
            min={today}
            onChange={(e) => {
              onSetStartDate(e.target.value)
              if (e.target.value >= state.endDate) onSetEndDate(addDays(e.target.value, 1))
            }}
          />
        </div>
        <div>
          <label htmlFor="wizard-end-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Salida</label>
          <input
            id="wizard-end-date"
            type="date"
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            value={state.endDate}
            min={addDays(state.startDate, 1)}
            onChange={(e) => onSetEndDate(e.target.value)}
          />
        </div>
      </div>

      {nights > 0 && (
        <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
          {nights} noche{nightPluralSuffix(nights)}
        </p>
      )}

      <div>
        <label htmlFor="wizard-agreed-price" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Precio acordado (total)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
          <input
            id="wizard-agreed-price"
            type="number"
            min="0"
            className="w-full pl-7 pr-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            value={state.agreedPrice}
            onChange={(e) => onSetAgreedPrice(e.target.value)}
            placeholder="0"
          />
        </div>
        {state.room?.room_type?.base_price && nights > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {suggestedPriceHint(state.room, nights)}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="wizard-deposit" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Depósito recibido <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
          <input
            id="wizard-deposit"
            type="number"
            min="0"
            className="w-full pl-7 pr-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            value={state.depositAmount}
            onChange={(e) => onSetDepositAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label htmlFor="wizard-notes" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notas</label>
        <textarea
          id="wizard-notes"
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
          style={{ background: 'var(--bg-main)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          value={state.notes}
          onChange={(e) => onSetNotes(e.target.value)}
          placeholder="Observaciones, preferencias..."
        />
      </div>
    </div>
  )
}

interface ConfirmationStepProps {
  readonly state: WizardState
  readonly nights: number
}

function ConfirmationStep({ state, nights }: ConfirmationStepProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)' }}>
        <Row label="Huésped" value={state.guest?.full_name ?? '—'} />
        {state.guest?.document_number && (
          <Row label="Documento" value={state.guest.document_number} />
        )}
        {state.room && (
          <Row label="Habitación" value={roomSummaryValue(state.room)} />
        )}
        {state.company && <Row label="Empresa" value={state.company.name} />}
        <Row label="Llegada" value={state.startDate} />
        <Row label="Salida" value={state.endDate} />
        <Row label="Noches" value={String(nights)} />
        <Row label="Precio total" value={`$${fmt(Number(state.agreedPrice))}`} highlight />
        {state.depositAmount && (
          <Row label="Depósito" value={`$${fmt(Number(state.depositAmount))}`} />
        )}
        {state.notes && <Row label="Notas" value={state.notes} />}
      </div>
    </div>
  )
}

interface RowProps {
  readonly label: string
  readonly value: string
  readonly highlight?: boolean
}

function Row({ label, value, highlight }: RowProps) {
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

export default function NewReservationWizard({ prefillStartDate, prefillRoom, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const { dialogRef, backdropClassName } = useDialogLifecycle(onClose)

  const [step, setStep] = useState<StepId>('guest')
  const [state, setState] = useState<WizardState>({
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

  const [creatingNew, setCreatingNew] = useState(false)
  const [newGuest, setNewGuest] = useState<NewGuestForm>({
    ...emptyPersonName(),
    document_type:   'cc',
    document_number: '',
    email:           '',
    phone:           '',
    nationality_id:  '',
  })
  const [guestError, setGuestError] = useState('')
  const [savingGuest, setSavingGuest] = useState(false)

  const { create, isCreating } = useReservations()
  const { data: guestResults = [], isLoading: guestsLoading } = useGuestSearch(state.guestSearch)
  const { data: companyResults = [], isLoading: companiesLoading } = useCompanySearch(state.companySearch)
  const { rooms: allRooms } = useRooms()

  const availableRooms = allRooms.filter(isAvailableRoom)
  const nights = nightsBetween(state.startDate, state.endDate)
  const stepIndex = STEPS.indexOf(step)

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const setNG = <K extends keyof NewGuestForm>(key: K, val: NewGuestForm[K]) =>
    setNewGuest((prev) => ({ ...prev, [key]: val }))

  const selectRoom = (room: Room) => {
    set('room', room)
    if (!state.agreedPrice && room.room_type?.base_price) {
      set('agreedPrice', String(room.room_type.base_price))
    }
  }

  const createGuestAndAdvance = async () => {
    setSavingGuest(true)
    setGuestError('')
    try {
      const created = await createGuestApi({
        primer_nombre:    newGuest.primer_nombre.trim(),
        segundo_nombre:   newGuest.segundo_nombre.trim(),
        primer_apellido:  newGuest.primer_apellido.trim(),
        segundo_apellido: newGuest.segundo_apellido.trim(),
        document_type:   newGuest.document_type,
        document_number: newGuest.document_number.trim(),
        email:           newGuest.email.trim() || undefined,
        phone:           newGuest.phone.trim() || undefined,
        nationality_id:  newGuest.nationality_id || undefined,
      })
      set('guest', created)
      setCreatingNew(false)
      setStep(STEPS[stepIndex + 1])
    } catch (err) {
      setGuestError(extractApiError(err, 'Error al crear huésped.'))
    } finally {
      setSavingGuest(false)
    }
  }

  const next = async () => {
    if (step === 'guest' && creatingNew) {
      await createGuestAndAdvance()
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

  const advanceAllowed = canAdvanceStep(step, creatingNew, newGuest, state, nights)

  let stepContent: ReactNode
  if (step === 'guest') {
    stepContent = (
      <GuestStep
        state={state}
        creatingNew={creatingNew}
        newGuest={newGuest}
        guestError={guestError}
        guestsLoading={guestsLoading}
        guestResults={guestResults}
        onSetGuest={(guest) => set('guest', guest)}
        onSetGuestSearch={(value) => set('guestSearch', value)}
        onSetCreatingNew={setCreatingNew}
        onSetGuestError={setGuestError}
        onSetNewGuestField={setNG}
      />
    )
  } else if (step === 'room') {
    stepContent = (
      <RoomStep
        state={state}
        availableRooms={availableRooms}
        onSelectRoom={selectRoom}
        onClearRoom={() => set('room', null)}
      />
    )
  } else if (step === 'company') {
    stepContent = (
      <CompanyStep
        state={state}
        companiesLoading={companiesLoading}
        companyResults={companyResults}
        onSetWithCompany={(value) => set('withCompany', value)}
        onSetCompany={(company) => set('company', company)}
        onSetCompanySearch={(value) => set('companySearch', value)}
      />
    )
  } else if (step === 'dates') {
    stepContent = (
      <DatesStep
        state={state}
        today={today}
        nights={nights}
        onSetStartDate={(value) => set('startDate', value)}
        onSetEndDate={(value) => set('endDate', value)}
        onSetAgreedPrice={(value) => set('agreedPrice', value)}
        onSetDepositAmount={(value) => set('depositAmount', value)}
        onSetNotes={(value) => set('notes', value)}
      />
    )
  } else {
    stepContent = <ConfirmationStep state={state} nights={nights} />
  }

  let primaryFooterAction: ReactNode
  if (step === 'confirmation') {
    primaryFooterAction = (
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isCreating}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: 'var(--color-primary)' }}
      >
        <CheckCircle size={16} />
        {wizardConfirmLabel(isCreating)}
      </button>
    )
  } else {
    primaryFooterAction = (
      <button
        type="button"
        onClick={next}
        disabled={!advanceAllowed || savingGuest}
        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40"
        style={{ background: 'var(--color-primary)' }}
      >
        {wizardNextLabel(savingGuest)} <ChevronRight size={16} />
      </button>
    )
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Nueva reserva"
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Nueva Reserva</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Paso {stepIndex + 1} de {STEPS.length} · {STEP_LABELS[step]}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="h-1 w-full" style={{ background: 'var(--border-default)' }}>
          <div
            className="h-1 transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%`, background: 'var(--color-primary)' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {stepContent}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            type="button"
            onClick={prev}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
            style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            <ChevronLeft size={16} /> Atrás
          </button>
          {primaryFooterAction}
        </div>
      </div>
    </dialog>
  )
}
