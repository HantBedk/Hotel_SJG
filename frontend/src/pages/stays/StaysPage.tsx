import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStays, useStay } from '@/hooks/useStays'
import { useAuth } from '@/hooks/useAuth'
import { StayDrawer } from './components/StayDrawer'
import { CheckoutWizard } from './components/CheckoutWizard'
import { StaysFiltersBar } from './stays-page/StaysFiltersBar'
import { StaysTable } from './stays-page/StaysTable'
import { filterStaysByGuest, toStayList } from './stays-page/utils'
import type { Stay } from '@/types'

export default function StaysPage() {
  const { hasPermission } = useAuth()
  const canCheckOut = hasPermission('check_out')

  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId = searchParams.get('id')
  const deepLinkAction = searchParams.get('action')

  const [statusFilter, setStatusFilter] = useState('active')
  const [guestSearch, setGuestSearch] = useState('')
  const [selected, setSelected] = useState<Stay | null>(null)
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null)

  const { stays: rawStays, isLoading, transfer, addPayment, addService, addMinibar, extend } = useStays({ status: statusFilter })
  const { data: deepLinkStay } = useStay(deepLinkId ?? '')

  const stays = useMemo(
    () => filterStaysByGuest(toStayList(rawStays), guestSearch),
    [rawStays, guestSearch],
  )

  useEffect(() => {
    setSelected((current) => {
      if (!current) return current
      const updated = toStayList(rawStays).find((s) => s.id === current.id)
      return updated ?? current
    })
  }, [rawStays])

  useEffect(() => {
    if (!deepLinkId || !deepLinkStay) return
    setSelected(deepLinkStay)
    if (deepLinkAction === 'checkout' && deepLinkStay.status === 'active') {
      setCheckoutStay(deepLinkStay)
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('id')
      next.delete('action')
      return next
    }, { replace: true })
  }, [deepLinkId, deepLinkStay, deepLinkAction, setSearchParams])

  const handleCheckoutSuccess = () => {
    setCheckoutStay(null)
    setSelected(null)
  }

  const handleCheckOutFromDrawer = (id: string) => {
    const stay = stays.find((s) => s.id === id)
    if (stay) setCheckoutStay(stay)
  }

  return (
    <div className="space-y-5">
      <StaysFiltersBar
        statusFilter={statusFilter}
        guestSearch={guestSearch}
        onStatusChange={setStatusFilter}
        onGuestSearchChange={setGuestSearch}
      />

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <StaysTable
          stays={stays}
          isLoading={isLoading}
          statusFilter={statusFilter}
          canCheckOut={canCheckOut}
          onSelect={setSelected}
          onCheckout={setCheckoutStay}
        />
      </div>

      {selected && (
        <StayDrawer
          stayId={selected.id}
          initialStay={selected}
          onClose={() => setSelected(null)}
          canCheckOut={canCheckOut}
          onCheckOut={handleCheckOutFromDrawer}
          onAddPayment={addPayment}
          onAddService={addService}
          onAddMinibar={addMinibar}
          onTransfer={transfer}
          onExtend={extend}
        />
      )}

      {checkoutStay && (
        <CheckoutWizard
          stay={checkoutStay}
          onClose={() => setCheckoutStay(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  )
}
