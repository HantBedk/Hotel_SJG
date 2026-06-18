import { useMemo, useState, useEffect } from 'react'
import { LayoutGrid } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/Skeleton'
import CheckInWizard from '@/pages/checkin/CheckInWizard'
import { CheckoutWizard } from '@/pages/stays/components/CheckoutWizard'
import { StayDrawer } from '@/pages/stays/components/StayDrawer'
import CheckInFromReservationModal from '@/pages/reservations/components/CheckInFromReservationModal'
import { DashboardChart } from './components/DashboardChart'
import { DashboardRoomModal } from './components/DashboardRoomModal'
import AlertsWidget from './components/AlertsWidget'
import PendingBalancesWidget from './components/PendingBalancesWidget'
import RecentActivityWidget from './components/RecentActivityWidget'
import RoomsStatusGrid, { type RoomPlanDensity } from './components/RoomsStatusGrid'
import RoomStatusLegend from './components/RoomStatusLegend'
import DashboardSection from './components/DashboardSection'
import {
  DashboardRoomFilters,
  filterDashboardRooms,
  type RoomGridFilter,
} from './components/dashboardRoomFilters'
import KpiCard from './components/KpiCard'
import ActivityDetailModal from './components/ActivityDetailModal'
import OccupancyBreakdownModal from './components/OccupancyBreakdownModal'
import { buildDashboardKpis, kpiSkeletonKeys } from './dashboardKpis'
import { useDashboardPage } from './hooks/useDashboardPage'
import { useAuth } from '@/hooks/useAuth'
import { StayVoidReviewModal } from '@/pages/stays/components/StayVoidReviewModal'
import { useStayVoidRequest } from '@/hooks/useStayVoidRequests'
import type { Reservation, Room, Stay } from '@/types'

export default function DashboardPage() {
  const { hasPermission } = useAuth()
  const [roomSearch, setRoomSearch] = useState('')
  const [roomFilter, setRoomFilter] = useState<RoomGridFilter>('all')
  const [roomPlanDensity, setRoomPlanDensity] = useState<RoomPlanDensity>('compact')

  const {
    stats,
    isLoading,
    rooms,
    loadingRooms,
    isChanging,
    housekeepers,
    canViewActivity,
    canCheckOut,
    activityLogs,
    checkingIn,
    setCheckingIn,
    checkoutStay,
    setCheckoutStay,
    showOccupancy,
    setShowOccupancy,
    selectedBalanceStay,
    setSelectedBalanceStay,
    selectedRoom,
    setSelectedRoom,
    checkInReservation,
    setCheckInReservation,
    selectedActivity,
    setSelectedActivity,
    stayForSelectedRoom,
    staysWithBalance,
    occupancyPct,
    handleRoomStatusChange,
    handleResolveAlert,
    addPayment,
    addService,
    addMinibar,
    transfer,
    extend,
    activeStays,
    navigate,
    requestVoid,
    isRequestingVoid,
    canApproveVoid,
    pendingVoidTotal,
    pendingVoidRequests,
    reviewVoidId,
    setReviewVoidId,
    approveVoid,
    rejectVoid,
    isApprovingVoid,
    isRejectingVoid,
  } = useDashboardPage()

  const { data: reviewVoidRequest } = useStayVoidRequest(reviewVoidId ?? '', !!reviewVoidId)

  const kpis = buildDashboardKpis(
    stats,
    occupancyPct,
    () => setShowOccupancy(true),
    hasPermission('view_reports') ? () => navigate('/income?preset=today') : undefined,
  )

  const filteredRooms = useMemo(
    () => filterDashboardRooms(rooms, roomFilter, roomSearch),
    [rooms, roomFilter, roomSearch],
  )

  const balanceStayId = selectedBalanceStay?.stay.id

  useEffect(() => {
    if (!balanceStayId) return
    const updated = (activeStays as Stay[]).find((s) => s.id === balanceStayId)
    if (!updated) return
    const prevIds = selectedBalanceStay?.stay.stay_rooms
      ?.filter((sr) => sr.is_active)
      .map((sr) => sr.room_id)
      .join(',') ?? ''
    const nextIds = updated.stay_rooms
      ?.filter((sr) => sr.is_active)
      .map((sr) => sr.room_id)
      .join(',') ?? ''
    if (prevIds !== nextIds) {
      setSelectedBalanceStay((row) => (row ? { ...row, stay: updated } : null))
    }
  }, [activeStays, balanceStayId, selectedBalanceStay?.stay.stay_rooms])

  const hasRoomFilters = roomFilter !== 'all' || roomSearch.trim().length > 0

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 pb-4 max-w-[1600px]">
      {canApproveVoid && pendingVoidTotal > 0 && (
        <button
          type="button"
          onClick={() => {
            const firstId = pendingVoidRequests[0]?.id
            if (firstId) setReviewVoidId(firstId)
          }}
          className="shrink-0 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-opacity hover:opacity-90"
          style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#92400E' }}>
            Anulaciones pendientes ({pendingVoidTotal})
          </span>
          <span className="text-xs font-medium" style={{ color: '#B45309' }}>
            Revisar →
          </span>
        </button>
      )}

      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 ${kpis.length === 6 ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-3 shrink-0`}>
        {isLoading
          ? kpiSkeletonKeys(kpis.length).map((key) => <SkeletonCard key={key} />)
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="flex flex-col gap-4 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-12">
        <div className="lg:col-span-6 flex flex-col gap-4 lg:min-h-0">
          <DashboardSection
            id="dashboard-rooms"
            title="Habitaciones"
            description="Vista compacta · clic para detalle, check-in o cambio de estado"
            icon={LayoutGrid}
            className="lg:flex-[3] lg:min-h-[22rem]"
            bodyClassName="flex flex-col gap-2.5 min-h-0 !p-4"
          >
            <DashboardRoomFilters
              search={roomSearch}
              filter={roomFilter}
              density={roomPlanDensity}
              total={rooms.length}
              filtered={filteredRooms.length}
              onSearchChange={setRoomSearch}
              onFilterChange={setRoomFilter}
              onDensityChange={setRoomPlanDensity}
            />
            <div className="flex-1 overflow-y-auto min-h-[12rem] max-h-[min(55vh,28rem)] lg:max-h-none pr-0.5 -mr-0.5">
              <RoomsStatusGrid
                loading={loadingRooms}
                rooms={filteredRooms}
                density={roomPlanDensity}
                onSelectRoom={setSelectedRoom}
                hasFilters={hasRoomFilters}
              />
            </div>
            <RoomStatusLegend />
          </DashboardSection>

          <div className="flex flex-col lg:flex-[2] lg:min-h-0">
            <DashboardChart />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 lg:min-h-0">
          {canViewActivity && (
            <RecentActivityWidget
              logs={activityLogs}
              onSelect={setSelectedActivity}
            />
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 lg:min-h-0">
          <AlertsWidget rooms={rooms} onResolve={handleResolveAlert} />
          <PendingBalancesWidget items={staysWithBalance} onSelect={setSelectedBalanceStay} />
        </div>
      </div>

      {checkingIn.length > 0 && (
        <CheckInWizard rooms={checkingIn} onClose={() => setCheckingIn([])} />
      )}

      {showOccupancy && stats && (
        <OccupancyBreakdownModal stats={stats} onClose={() => setShowOccupancy(false)} />
      )}

      {selectedBalanceStay && (
        <StayDrawer
          stayId={selectedBalanceStay.stay.id}
          initialStay={selectedBalanceStay.stay}
          onClose={() => setSelectedBalanceStay(null)}
          canCheckOut={canCheckOut}
          onCheckOut={(id) => {
            const stay = (activeStays as Stay[]).find((s) => s.id === id)
            if (stay) {
              setCheckoutStay(stay)
              setSelectedBalanceStay(null)
            }
          }}
          onAddPayment={addPayment}
          onAddService={addService}
          onAddMinibar={addMinibar}
          onTransfer={transfer}
          onExtend={extend}
        />
      )}

      <DashboardRoomModal
        room={selectedRoom}
        stay={stayForSelectedRoom}
        housekeepers={housekeepers}
        isChangingStatus={isChanging}
        onChangeStatus={handleRoomStatusChange}
        onStartCheckIn={(room: Room) => setCheckingIn([room])}
        onStartCheckOut={(stay: Stay) => setCheckoutStay(stay)}
        onAddPayment={addPayment}
        onRequestVoid={(stayId, reason) => requestVoid({ stayId, reason })}
        isRequestingVoid={isRequestingVoid}
        onSelectReservation={(reservation: Reservation) => setCheckInReservation(reservation)}
        onClose={() => setSelectedRoom(null)}
      />

      {checkoutStay && (
        <CheckoutWizard
          stay={checkoutStay}
          onClose={() => setCheckoutStay(null)}
          onSuccess={() => setCheckoutStay(null)}
        />
      )}

      {selectedActivity && (
        <ActivityDetailModal
          log={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {checkInReservation && (
        <CheckInFromReservationModal
          reservation={checkInReservation}
          rooms={rooms}
          onClose={() => setCheckInReservation(null)}
          onSuccess={() => setCheckInReservation(null)}
        />
      )}

      <StayVoidReviewModal
        open={!!reviewVoidId && !!reviewVoidRequest}
        request={reviewVoidRequest ?? null}
        onClose={() => setReviewVoidId(null)}
        onApprove={(notes) => approveVoid({ id: reviewVoidId!, adminNotes: notes })}
        onReject={(notes) => rejectVoid({ id: reviewVoidId!, adminNotes: notes })}
        isApproving={isApprovingVoid}
        isRejecting={isRejectingVoid}
      />
    </div>
  )
}
