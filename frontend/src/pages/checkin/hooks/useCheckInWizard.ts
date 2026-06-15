import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { useGuestSearch } from '@/hooks/useGuests'
import { useCompanySearch } from '@/hooks/useCompanies'
import { useStays } from '@/hooks/useStays'
import { useHotelTimes } from '@/hooks/useHotelTimes'
import { createGuestApi, updateGuestApi, searchGuestsApi } from '@/services/guests.service'
import { createCompanyApi } from '@/services/companies.service'
import type { Room, Guest, Company } from '@/types'
import { extractApiError } from '@/lib/apiError'
import { OCCUPANCY_KEYS } from '@/pages/checkin/constants'
import { isPersonNameValid, personNameFromGuest } from '@/types/person'
import {
  buildSteps,
  canAdvanceStep,
  createInitialWizardState,
  extraIndex,
  isConfirmValid,
  isExtraMinor,
  nightCount,
  resolveAdditionalGuestIds,
  resolveCompanyId,
  resolveMainGuestId,
  toISOLocal,
} from '@/pages/checkin/wizardLogic'
import { makeExtraForm, type AdditionalGuestForm } from '@/pages/checkin/ExtraGuestStep'
import type { StepId, WizardState } from '@/pages/checkin/types'

export function useCheckInWizard(rooms: Room[], onClose: () => void) {
  const [currentStep, setCurrentStep] = useState<StepId>('occupancy')
  const [state, setState] = useState<WizardState>(() => createInitialWizardState(rooms))
  const [isSaving, setIsSaving] = useState(false)

  const guestInputRef = useRef<HTMLInputElement>(null)
  const docSearchTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const { data: guestResults = [] } = useGuestSearch(state.guestSearch)
  const { data: companyResults = [] } = useCompanySearch(state.companySearch)
  const { checkIn, isCheckingIn } = useStays()
  const { checkOutTime } = useHotelTimes()

  const steps = buildSteps(state)
  const currentIdx = steps.indexOf(currentStep)
  const isFirst = currentIdx === 0
  const isLast = currentIdx === steps.length - 1
  const nights = nightCount(state.checkInDate, state.checkOutDate)
  const totalEstimated = rooms.reduce((sum, r) => {
    return sum + Number.parseFloat(state.prices[r.id] ?? r.room_type.base_price) * nights
  }, 0)

  const showApiError = (err: unknown, fallback: string) => {
    toast.error(extractApiError(err, fallback))
  }

  const syncAdditionalForms = (adults: number, children: number) => {
    const needed = Math.max(0, adults + children - 1)
    setState((s) => {
      const cur = s.additionalGuests.length
      if (cur === needed) return s
      if (cur < needed) {
        const extra = Array.from({ length: needed - cur }, (_, i) =>
          makeExtraForm(isExtraMinor(cur + i, adults)),
        )
        return { ...s, additionalGuests: [...s.additionalGuests, ...extra] }
      }
      return { ...s, additionalGuests: s.additionalGuests.slice(0, needed) }
    })
  }

  const setExtra = (idx: number, patch: Partial<AdditionalGuestForm>) =>
    setState((s) => ({
      ...s,
      additionalGuests: s.additionalGuests.map((ag, i) => i === idx ? { ...ag, ...patch } : ag),
    }))

  const navigateNext = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      if (currentStep === 'occupancy') {
        syncAdditionalForms(state.adults, state.children)
      }

      if (currentStep === 'main-guest') {
        if (state.isNewGuest) {
          const created = await createGuestApi(state.newGuest)
          setState((s) => ({ ...s, guest: created, isNewGuest: false }))
          toast.success('Huésped guardado.')
        }
      }

      if (
        currentStep === 'company'
        && state.withCompany
        && state.isNewCompany
        && state.newCompany.name.trim()
      ) {
        const created = await createCompanyApi(state.newCompany)
        setState((s) => ({ ...s, company: created, isNewCompany: false }))
        toast.success('Empresa guardada.')
      }

      const next = steps[currentIdx + 1]
      if (next) setCurrentStep(next)
    } catch (err) {
      showApiError(err, 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  const navigatePrev = () => {
    const prev = steps[currentIdx - 1]
    if (prev) setCurrentStep(prev)
  }

  const persistExtraGuest = async (idx: number) => {
    const ag = state.additionalGuests[idx]
    if (!ag) return
    if (!isPersonNameValid(ag.newGuest) || !ag.newGuest.document_number.trim()) return
    const isMinor = isExtraMinor(idx, state.adults)

    setIsSaving(true)
    try {
      const created = await createGuestApi({
        ...ag.newGuest,
        is_minor: isMinor,
        relationship: isMinor ? (ag.newGuest.relationship || undefined) : undefined,
        phone: isMinor ? undefined : ag.newGuest.phone,
        email: isMinor ? undefined : ag.newGuest.email,
        nationality_id: ag.newGuest.nationality_id || undefined,
      })
      setExtra(idx, { found: created, notFound: false, registered: true })
      toast.success('Huésped guardado.')
    } catch (err) {
      showApiError(err, 'Error al guardar huésped.')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmExtraGuest = async (idx: number) => {
    const ag = state.additionalGuests[idx]
    if (!ag?.found) return
    const isMinor = isExtraMinor(idx, state.adults)
    setIsSaving(true)
    try {
      if (ag.isEditing) {
        const editPayload = isMinor
          ? {
              ...ag.editData,
              relationship: ag.editData.relationship || null,
              is_minor: true,
            }
          : {
              ...ag.editData,
              nationality_id: ag.editData.nationality_id || undefined,
            }
        await updateGuestApi(ag.found.id, editPayload)
        toast.success('Datos actualizados.')
      }
      setExtra(idx, { registered: true, isEditing: false })
    } catch (err) {
      showApiError(err, 'Error al actualizar huésped.')
    } finally {
      setIsSaving(false)
    }
  }

  const pickExtraGuest = (idx: number, guest: Guest) => {
    setExtra(idx, {
      isSearching: false,
      found: guest,
      searchResults: [],
      notFound: false,
      documentInput: guest.full_name,
      editData: {
        ...personNameFromGuest(guest),
        phone: guest.phone ?? '',
        email: guest.email ?? '',
        nationality_id: guest.nationality_id ?? '',
        relationship: guest.relationship ?? '',
      },
    })
  }

  const searchExtra = async (idx: number, term: string) => {
    if (!term.trim()) return
    setExtra(idx, { isSearching: true, found: null, notFound: false, registered: false })
    try {
      const guests = await searchGuestsApi(term.trim())
      setExtra(idx, { isSearching: false, searchResults: guests })
    } catch {
      setExtra(idx, { isSearching: false, searchResults: [] })
    }
  }

  const handleDocInputChange = (idx: number, value: string) => {
    setExtra(idx, { documentInput: value, found: null, notFound: false, searchResults: [] })
    const prev = docSearchTimeouts.current[idx]
    if (prev) clearTimeout(prev)
    const trimmed = value.trim()
    if (trimmed.length < 1) return
    docSearchTimeouts.current[idx] = setTimeout(() => {
      searchExtra(idx, trimmed)
    }, 300)
  }

  const handleConfirm = async () => {
    try {
      const guestId = await resolveMainGuestId(state)
      const additionalGuestIds = await resolveAdditionalGuestIds(state)
      const companyId = await resolveCompanyId(state)

      await checkIn({
        guest_id: guestId,
        company_id: companyId,
        room_ids: rooms.map((r) => r.id),
        check_in_datetime: toISOLocal(state.checkInDate),
        check_out_datetime: toISOLocal(state.checkOutDate + (state.checkOutDate.length === 10 ? `T${checkOutTime}` : '')),
        prices: Object.fromEntries(Object.entries(state.prices).map(([k, v]) => [k, Number.parseFloat(v)])),
        notes: state.notes || undefined,
        additional_guest_ids: additionalGuestIds.length > 0 ? additionalGuestIds : undefined,
      })
      onClose()
    } catch (err) {
      showApiError(err, 'Error al procesar el check-in')
    }
  }

  return {
    state,
    setState,
    currentStep,
    steps,
    currentIdx,
    isFirst,
    isLast,
    nights,
    totalEstimated,
    isSaving,
    isCheckingIn,
    canGoNext: canAdvanceStep(state, currentStep),
    confirmValid: isConfirmValid(state, nights),
    guestInputRef,
    guestResults,
    companyResults,
    navigation: { navigateNext, navigatePrev, handleConfirm },
    occupancy: {
      onDecrement: (key: typeof OCCUPANCY_KEYS[number]) => {
        setState((s) => ({
          ...s,
          [key]: key === 'adults' ? Math.max(1, s.adults - 1) : Math.max(0, s.children - 1),
        }))
      },
      onIncrement: (key: typeof OCCUPANCY_KEYS[number]) => {
        setState((s) => ({ ...s, [key]: s[key] + 1 }))
      },
    },
    mainGuest: {
      onNewGuestChange: (patch: Partial<WizardState['newGuest']>) => {
        setState((s) => ({ ...s, newGuest: { ...s.newGuest, ...patch } }))
      },
      onGuestSearchChange: (value: string) => {
        setState((s) => ({ ...s, guestSearch: value, guest: null }))
      },
      onSelectGuest: (guest: Guest) => {
        setState((s) => ({ ...s, guest, guestSearch: guest.full_name }))
      },
      onClearGuest: () => setState((s) => ({ ...s, guest: null, guestSearch: '' })),
      onStartNewGuest: () => setState((s) => ({ ...s, isNewGuest: true, guest: null })),
      onBackToSearch: () => setState((s) => ({ ...s, isNewGuest: false })),
      onWithCompanyChange: (checked: boolean) => setState((s) => ({ ...s, withCompany: checked })),
    },
    company: {
      onNewCompanyChange: (patch: Partial<WizardState['newCompany']>) => {
        setState((s) => ({ ...s, newCompany: { ...s.newCompany, ...patch } }))
      },
      onCompanySearchChange: (value: string) => {
        setState((s) => ({ ...s, companySearch: value, company: null }))
      },
      onSelectCompany: (company: Company) => {
        setState((s) => ({ ...s, company, companySearch: company.name }))
      },
      onClearCompany: () => setState((s) => ({ ...s, company: null, companySearch: '' })),
      onStartNewCompany: () => setState((s) => ({ ...s, isNewCompany: true, company: null })),
      onBackToSearch: () => setState((s) => ({ ...s, isNewCompany: false })),
    },
    confirmation: {
      onCheckInDateChange: (value: string) => setState((s) => ({ ...s, checkInDate: value })),
      onCheckOutDateChange: (value: string) => setState((s) => ({ ...s, checkOutDate: value })),
      onRoomPriceChange: (roomId: string, value: string) => {
        setState((s) => ({ ...s, prices: { ...s.prices, [roomId]: value } }))
      },
      onNotesChange: (value: string) => setState((s) => ({ ...s, notes: value })),
    },
    extraGuest: {
      setExtra,
      handleDocInputChange,
      pickExtraGuest,
      confirmExtraGuest,
      persistExtraGuest,
      extraIndex,
      isExtraMinor,
    },
  }
}

export type CheckInWizardController = ReturnType<typeof useCheckInWizard>
