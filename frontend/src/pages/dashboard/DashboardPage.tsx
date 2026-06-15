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
import RoomsStatusGrid from './components/RoomsStatusGrid'
import RoomStatusLegend from './components/RoomStatusLegend'
import KpiCard from './components/KpiCard'
import ActivityDetailModal from './components/ActivityDetailModal'
import OccupancyBreakdownModal from './components/OccupancyBreakdownModal'
import { buildDashboardKpis, kpiSkeletonKeys } from './dashboardKpis'
import { useDashboardPage } from './hooks/useDashboardPage'
import { useAuth } from '@/hooks/useAuth'
import type { Reservation, Room, Stay } from '@/types'

export default function DashboardPage() {
  const { hasPermission } = useAuth()
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
  } = useDashboardPage()

  const kpis = buildDashboardKpis(
    stats,
    occupancyPct,
    () => setShowOccupancy(true),
    hasPermission('view_reports') ? () => navigate('/income?preset=today') : undefined,
  )

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 animate-in fade-in duration-300">
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 ${kpis.length === 6 ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-3 shrink-0`}>
        {isLoading
          ? kpiSkeletonKeys(kpis.length).map((key) => <SkeletonCard key={key} />)
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6 flex flex-col gap-3 min-h-0">
          <div
            className="rounded-xl shadow-sm p-3 flex flex-col min-h-0 flex-[3]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-bold mb-2 shrink-0" style={{ color: 'var(--text-primary)' }}>
              Estado de Habitaciones
            </h3>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              <RoomsStatusGrid
                loading={loadingRooms}
                rooms={rooms}
                onSelectRoom={setSelectedRoom}
              />
            </div>
            <RoomStatusLegend />
          </div>
          <div className="flex flex-col flex-[2] min-h-0">
            <DashboardChart />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          {canViewActivity && (
            <RecentActivityWidget
              logs={activityLogs}
              onSelect={setSelectedActivity}
            />
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
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
    </div>
  )
}
