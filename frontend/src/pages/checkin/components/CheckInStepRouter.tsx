import type { CheckInWizardController } from '@/pages/checkin/hooks/useCheckInWizard'
import { ExtraGuestStep } from '@/pages/checkin/ExtraGuestStep'
import { OccupancyStep } from '@/pages/checkin/components/OccupancyStep'
import { MainGuestStep } from '@/pages/checkin/components/MainGuestStep'
import { CompanyStep } from '@/pages/checkin/components/CompanyStep'
import { ConfirmationStep } from '@/pages/checkin/components/ConfirmationStep'
import type { Room } from '@/types'

interface CheckInStepRouterProps {
  readonly wizard: CheckInWizardController
  readonly rooms: Room[]
}

export function CheckInStepRouter({ wizard, rooms }: CheckInStepRouterProps) {
  const { currentStep, state, extraGuest } = wizard

  if (currentStep === 'occupancy') {
    return (
      <OccupancyStep
        adults={state.adults}
        childCount={state.children}
        onDecrement={wizard.occupancy.onDecrement}
        onIncrement={wizard.occupancy.onIncrement}
      />
    )
  }

  if (currentStep === 'main-guest') {
    return (
      <MainGuestStep
        guestInputRef={wizard.guestInputRef}
        isNewGuest={state.isNewGuest}
        newGuest={state.newGuest}
        guest={state.guest}
        guestSearch={state.guestSearch}
        guestResults={wizard.guestResults}
        withCompany={state.withCompany}
        onNewGuestChange={wizard.mainGuest.onNewGuestChange}
        onGuestSearchChange={wizard.mainGuest.onGuestSearchChange}
        onSelectGuest={wizard.mainGuest.onSelectGuest}
        onClearGuest={wizard.mainGuest.onClearGuest}
        onStartNewGuest={wizard.mainGuest.onStartNewGuest}
        onBackToSearch={wizard.mainGuest.onBackToSearch}
        onWithCompanyChange={wizard.mainGuest.onWithCompanyChange}
      />
    )
  }

  if (currentStep === 'company') {
    return (
      <CompanyStep
        guestInputRef={wizard.guestInputRef}
        isNewCompany={state.isNewCompany}
        newCompany={state.newCompany}
        company={state.company}
        companySearch={state.companySearch}
        companyResults={wizard.companyResults}
        onNewCompanyChange={wizard.company.onNewCompanyChange}
        onCompanySearchChange={wizard.company.onCompanySearchChange}
        onSelectCompany={wizard.company.onSelectCompany}
        onClearCompany={wizard.company.onClearCompany}
        onStartNewCompany={wizard.company.onStartNewCompany}
        onBackToSearch={wizard.company.onBackToSearch}
      />
    )
  }

  if (currentStep === 'confirmation') {
    return (
      <ConfirmationStep
        rooms={rooms}
        state={state}
        nights={wizard.nights}
        totalEstimated={wizard.totalEstimated}
        onCheckInDateChange={wizard.confirmation.onCheckInDateChange}
        onCheckOutDateChange={wizard.confirmation.onCheckOutDateChange}
        onRoomPriceChange={wizard.confirmation.onRoomPriceChange}
        onNotesChange={wizard.confirmation.onNotesChange}
      />
    )
  }

  const idx = extraGuest.extraIndex(currentStep)
  if (idx < 0) return null
  const ag = state.additionalGuests[idx]
  if (!ag) return null

  return (
    <ExtraGuestStep
      idx={idx}
      ag={ag}
      totalGuests={state.adults + state.children}
      isMinor={extraGuest.isExtraMinor(idx, state.adults)}
      isSaving={wizard.isSaving}
      onSetExtra={extraGuest.setExtra}
      onDocInputChange={extraGuest.handleDocInputChange}
      onPickGuest={extraGuest.pickExtraGuest}
      onConfirm={extraGuest.confirmExtraGuest}
      onPersist={extraGuest.persistExtraGuest}
    />
  )
}
