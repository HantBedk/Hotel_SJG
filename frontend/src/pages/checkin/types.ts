import type { Room, Guest, Company } from '@/types'
import type { AdditionalGuestForm } from '@/pages/checkin/ExtraGuestStep'
import type { PersonNameFields } from '@/types/person'

export type StepId = 'occupancy' | 'main-guest' | `extra-${number}` | 'company' | 'confirmation'

export interface CheckInWizardProps {
  readonly rooms: Room[]
  readonly onClose: () => void
}

export interface NewGuestFormState extends PersonNameFields {
  document_type: string
  document_number: string
  phone: string
  email: string
  nationality_id: string
}

export interface WizardState {
  adults: number
  children: number
  guest: Guest | null
  guestSearch: string
  isNewGuest: boolean
  newGuest: NewGuestFormState
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
