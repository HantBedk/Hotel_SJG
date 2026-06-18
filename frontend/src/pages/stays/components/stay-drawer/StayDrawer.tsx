import { useEffect, useState } from 'react'
import type { MinibarConsumption, Payment } from '@/types'
import { useStay, useStays } from '@/hooks/useStays'
import { useAuth } from '@/hooks/useAuth'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { CancelPaymentModal } from '@/components/payments/CancelPaymentModal'
import { CancelMinibarConsumptionModal } from '@/components/minibar/CancelMinibarConsumptionModal'
import { cn } from '@/lib/cn'
import type { StayDrawerProps } from './types'
import { nightsElapsed } from './utils'
import { StayDrawerHeader } from './StayDrawerHeader'
import { StayGuestSection } from './StayGuestSection'
import { StayCompanySection } from './StayCompanySection'
import { StayRoomsSection } from './StayRoomsSection'
import { StayDatesSection } from './StayDatesSection'
import { StayFinancialSection } from './StayFinancialSection'
import { StayExtendSection } from './StayExtendSection'
import { StayTransferSection } from './StayTransferSection'
import { StayServicesSection } from './StayServicesSection'
import { StayMinibarSection } from './StayMinibarSection'
import { StayPaymentsSection } from './StayPaymentsSection'
import { StayReceiptsSection } from './StayReceiptsSection'
import { StayNotesSection } from './StayNotesSection'
import { StayDrawerFooter } from './StayDrawerFooter'

export function StayDrawer({
  stayId, initialStay, onClose, canCheckOut, onCheckOut,
  onAddPayment, onAddService, onAddMinibar, onTransfer, onExtend,
}: StayDrawerProps) {
  const { data: freshStay, isLoading, isFetching } = useStay(stayId)
  const stay = freshStay ?? initialStay

  const activeRooms = stay.stay_rooms?.filter((sr) => sr.is_active) ?? []
  const nights = nightsElapsed(stay.check_in_datetime)
  const pendingBalance = Number(stay.total_amount ?? 0) - Number(stay.paid_amount ?? 0)
  const isOperable = stay.status === 'active' || stay.status === 'extended'
  const isVoidPending = stay.status === 'void_pending'
  const isVoidFinal = stay.status === 'voided' || stay.status === 'void_rejected'

  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null)
  const [cancelMinibarTarget, setCancelMinibarTarget] = useState<MinibarConsumption | null>(null)
  const { cancelPayment, isCancellingPayment, cancelMinibar, isCancellingMinibar } = useStays()
  const { hasPermission } = useAuth()
  const canCancelPayments = hasPermission('check_in') || hasPermission('check_out') || hasPermission('manage_reservations')
  const canCancelMinibar = stay.status !== 'checked_out' && canCancelPayments

  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = prev
    }
  }, [dialogRef])

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-label="Detalle de estadía"
        className={cn(
          'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
          'open:flex justify-end pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Cerrar panel"
          className="absolute inset-0 border-0 p-0 cursor-default pointer-events-auto"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        />
        <div
          className="relative pointer-events-auto w-full max-w-md h-full flex flex-col shadow-2xl"
          style={{ background: 'var(--bg-surface)' }}
        >
          <StayDrawerHeader activeRooms={activeRooms} isLoading={isLoading || isFetching} onClose={onClose} />

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {isVoidPending && (
              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' }}
              >
                Esta estadía tiene una solicitud de anulación pendiente. La habitación ya fue liberada;
                las operaciones están bloqueadas hasta que un administrador resuelva la solicitud.
              </div>
            )}
            {isVoidFinal && (
              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569' }}
              >
                {stay.status === 'voided'
                  ? 'Estadía anulada (registro histórico de auditoría).'
                  : 'Anulación rechazada. La habitación permanece disponible; no se admiten cambios.'}
              </div>
            )}
            {stay.guest && <StayGuestSection guest={stay.guest} />}
            {stay.company && <StayCompanySection company={stay.company} />}
            {stay.stay_rooms && stay.stay_rooms.length > 0 && (
              <StayRoomsSection stayRooms={stay.stay_rooms} />
            )}
            <StayDatesSection
              checkIn={stay.check_in_datetime}
              checkOut={stay.check_out_datetime}
              nights={nights}
            />
            <StayFinancialSection
              totalAmount={stay.total_amount}
              paidAmount={stay.paid_amount}
              pendingBalance={pendingBalance}
            />
            {isOperable && (
              <StayExtendSection stayId={stayId} stay={stay} onExtend={onExtend} />
            )}
            {isOperable && stay.status === 'active' && (
              <StayTransferSection
                stayId={stayId}
                activeRooms={activeRooms}
                onTransfer={onTransfer}
              />
            )}
            {isOperable && (
              <StayServicesSection stayId={stayId} stay={stay} onAddService={onAddService} />
            )}
            <StayMinibarSection
              stayId={stayId}
              stay={stay}
              activeRooms={activeRooms}
              canCancelMinibar={canCancelMinibar && isOperable}
              onAddMinibar={onAddMinibar}
              onRequestCancel={setCancelMinibarTarget}
            />
            <StayPaymentsSection
              stayId={stayId}
              stay={stay}
              canCancelPayments={canCancelPayments && isOperable}
              onAddPayment={onAddPayment}
              onRequestCancel={setCancelTarget}
            />
            <StayReceiptsSection stay={stay} />
            {stay.notes && <StayNotesSection notes={stay.notes} />}
          </div>

          {isOperable && stay.status === 'active' && canCheckOut && (
            <StayDrawerFooter onCheckOut={() => onCheckOut(stay.id)} />
          )}
        </div>
      </dialog>

      <CancelPaymentModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        payment={cancelTarget && {
          id: cancelTarget.id,
          amount: cancelTarget.amount,
          guest_name: stay.guest?.full_name,
          payment_method: cancelTarget.payment_method,
          payment_date: cancelTarget.payment_date,
        }}
        onConfirm={async (reason) => {
          if (!cancelTarget) return
          await cancelPayment({ stayId: stay.id, paymentId: cancelTarget.id, reason })
        }}
        isPending={isCancellingPayment}
      />

      <CancelMinibarConsumptionModal
        open={!!cancelMinibarTarget}
        onClose={() => setCancelMinibarTarget(null)}
        consumption={cancelMinibarTarget}
        onConfirm={async (reason) => {
          if (!cancelMinibarTarget) return
          await cancelMinibar({ stayId: stay.id, consumptionId: cancelMinibarTarget.id, reason })
        }}
        isPending={isCancellingMinibar}
      />
    </>
  )
}
