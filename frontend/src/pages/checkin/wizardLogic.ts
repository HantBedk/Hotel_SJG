import { addDaysLocal, nowLocalISO, todayLocalISO } from '@/lib/format'
import { calendarNightsBetween } from '@/lib/formatDate'
import { createGuestApi } from '@/services/guests.service'
import { createCompanyApi } from '@/services/companies.service'
import type { Room } from '@/types'
import type { AdditionalGuestForm } from '@/pages/checkin/ExtraGuestStep'
import type { StepId, WizardState } from '@/pages/checkin/types'
import { emptyPersonName, isPersonNameValid } from '@/types/person'

export function isExtraMinor(idx: number, adults: number): boolean {
  return idx >= Math.max(0, adults - 1)
}

export function extraStepId(index: number): StepId {
  return `extra-${index}`
}

export function buildSteps(state: WizardState): StepId[] {
  const pending = Math.max(0, state.adults + state.children - 1)
  const extra: StepId[] = Array.from({ length: pending }, (_, i) => extraStepId(i))
  const steps: StepId[] = ['occupancy', 'main-guest', ...extra]
  if (state.withCompany) steps.push('company')
  steps.push('confirmation')
  return steps
}

export function extraIndex(step: StepId): number {
  const m = /^extra-(\d+)$/.exec(step)
  return m ? Number.parseInt(m[1], 10) : -1
}

export function toISOLocal(dateStr: string): string {
  return new Date(dateStr).toISOString()
}

export function nightCount(from: string, to: string): number {
  const nights = calendarNightsBetween(from, to)
  return nights > 0 ? Math.max(1, nights) : 0
}

export function createInitialWizardState(rooms: Room[]): WizardState {
  return {
    adults: 1,
    children: 0,
    guest: null,
    guestSearch: '',
    isNewGuest: false,
    newGuest: {
      ...emptyPersonName(),
      document_type: 'cc',
      document_number: '',
      phone: '',
      email: '',
      nationality_id: '',
    },
    withCompany: false,
    additionalGuests: [],
    company: null,
    companySearch: '',
    isNewCompany: false,
    newCompany: { name: '', nit: '', phone: '', email: '', contact_name: '' },
    checkInDate: nowLocalISO(),
    checkOutDate: addDaysLocal(todayLocalISO(), 1),
    prices: Object.fromEntries(rooms.map((r) => [r.id, r.room_type.base_price])),
    notes: '',
  }
}

export function guestWord(count: number): string {
  return count === 1 ? 'huésped' : 'huéspedes'
}

export function formWord(count: number): string {
  return count === 1 ? 'formulario' : 'formularios'
}

export function formAdjective(count: number): string {
  return count === 1 ? 'adicional' : 'adicionales'
}

export function adultWord(count: number): string {
  return count === 1 ? 'adulto' : 'adultos'
}

export function childWord(count: number): string {
  return count === 1 ? 'niño' : 'niños'
}

export function pendingGuestWord(count: number): string {
  return count === 1 ? 'huésped' : 'huéspedes'
}

export function pendingSuffix(count: number): string {
  return count === 1 ? '' : 's'
}

export function roomLabel(count: number): string {
  return count === 1 ? 'Habitación' : 'Habitaciones'
}

export function isCompanyStepValid(state: Pick<WizardState, 'withCompany' | 'isNewCompany' | 'newCompany' | 'company'>): boolean {
  if (!state.withCompany) return true
  if (state.isNewCompany) return state.newCompany.name.trim() !== ''
  return state.company !== null
}

export function formatTotalGuestsLine(adults: number, children: number): string {
  let line = `${adults + children} (${adults} ${adultWord(adults)}`
  if (children > 0) line += `, ${children} ${childWord(children)}`
  line += ')'
  return line
}

export function additionalGuestSummaryName(ag: AdditionalGuestForm): string {
  if (ag.found) {
    if (ag.isEditing) {
      return [ag.editData.primer_nombre, ag.editData.segundo_nombre, ag.editData.primer_apellido, ag.editData.segundo_apellido]
        .filter(Boolean).join(' ').trim()
    }
    return ag.found.full_name
  }
  return [ag.newGuest.primer_nombre, ag.newGuest.segundo_nombre, ag.newGuest.primer_apellido, ag.newGuest.segundo_apellido]
    .filter(Boolean).join(' ').trim()
}

export function pendingRegistrationMessage(pendingCount: number): string {
  return `${pendingCount} ${pendingGuestWord(pendingCount)} pendiente${pendingSuffix(pendingCount)} de registrar.`
}

export function isMainGuestValid(state: WizardState): boolean {
  if (state.isNewGuest) {
    return isPersonNameValid(state.newGuest) && state.newGuest.document_number.trim() !== ''
  }
  return state.guest !== null
}

export function isConfirmValid(state: WizardState, nights: number): boolean {
  return state.checkInDate !== '' && state.checkOutDate !== '' && nights >= 1
}

export function canAdvanceStep(state: WizardState, step: StepId): boolean {
  if (step === 'occupancy') return state.adults >= 1
  if (step === 'main-guest') return isMainGuestValid(state)
  if (step === 'company') return isCompanyStepValid(state)
  if (step === 'confirmation') return isConfirmValid(state, nightCount(state.checkInDate, state.checkOutDate))
  const idx = extraIndex(step)
  return idx >= 0 ? (state.additionalGuests[idx]?.registered ?? false) : false
}

export async function resolveMainGuestId(state: WizardState): Promise<string> {
  if (state.isNewGuest) {
    const created = await createGuestApi(state.newGuest)
    return created.id
  }

  const guestId = state.guest?.id
  if (!guestId) throw new Error('Huésped titular requerido')
  return guestId
}

export async function resolveAdditionalGuestIds(state: WizardState): Promise<string[]> {
  const ids: string[] = []
  for (let i = 0; i < state.additionalGuests.length; i++) {
    const ag = state.additionalGuests[i]
    if (ag.found) {
      ids.push(ag.found.id)
    } else if (ag.notFound) {
      const isMinor = isExtraMinor(i, state.adults)
      const created = await createGuestApi({
        ...ag.newGuest,
        is_minor: isMinor,
        relationship: isMinor ? (ag.newGuest.relationship || undefined) : undefined,
        phone: isMinor ? undefined : ag.newGuest.phone,
        email: isMinor ? undefined : ag.newGuest.email,
        nationality_id: ag.newGuest.nationality_id || undefined,
      })
      ids.push(created.id)
    }
  }
  return ids
}

export async function resolveCompanyId(state: WizardState): Promise<string | undefined> {
  if (state.company?.id) return state.company.id
  if (state.withCompany && state.isNewCompany && state.newCompany.name) {
    const created = await createCompanyApi(state.newCompany)
    return created.id
  }
  return undefined
}
