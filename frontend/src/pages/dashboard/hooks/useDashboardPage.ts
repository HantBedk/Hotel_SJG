import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { useRooms, useHousekeepers } from '@/hooks/useRooms'
import { useStays } from '@/hooks/useStays'
import { useActivityLogs } from '@/hooks/useActivity'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { useStayVoidRequests } from '@/hooks/useStayVoidRequests'
import { useReverb } from '@/hooks/useReverb'
import { useHotelStore } from '@/store/hotelStore'
import { isPersistentRoomAlert } from '../dashboardAlerts'
import type {
  ActivityLogEntry, AppNotification, Reservation, Room, RoomStatus, Stay,
} from '@/types'
import type { PendingBalanceRow } from '../components/PendingBalancesWidget'

export function useDashboardPage() {
  const navigate = useNavigate()
  const { stats, isLoading } = useDashboard()
  const { rooms, isLoading: loadingRooms, changeStatus, isChanging, syncRoomStatus } = useRooms()
  const currentHotelId = useHotelStore((s) => s.currentHotelId)
  const { markRead: markNotificationRead } = useNotifications()
  const { hasPermission } = useAuth()
  const canViewActivity = hasPermission('view_activity_log')
  const { data: activityData } = useActivityLogs({ page: 1 }, { enabled: canViewActivity })
  const { data: housekeepers = [] } = useHousekeepers()
  const canCheckOut = hasPermission('check_out')
  const canApproveVoid = hasPermission('approve_stay_void')
  const {
    requestVoid,
    isRequesting,
    requests: pendingVoidRequests,
    total: pendingVoidTotal,
    approve,
    reject,
    isApproving,
    isRejecting,
  } = useStayVoidRequests('pending', canApproveVoid)
  const [reviewVoidId, setReviewVoidId] = useState<string | null>(null)

  useReverb<{ id: string; status: RoomStatus }>({
    channel: currentHotelId ? `hotel.${currentHotelId}.rooms` : 'hotel.rooms',
    event:   'room.status.changed',
    onEvent: ({ id, status }) => syncRoomStatus(id, status),
    enabled: !!currentHotelId,
  })

  const [checkingIn, setCheckingIn] = useState<Room[]>([])
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null)
  const [showOccupancy, setShowOccupancy] = useState(false)
  const [selectedBalanceStay, setSelectedBalanceStay] = useState<PendingBalanceRow | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [checkInReservation, setCheckInReservation] = useState<Reservation | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<ActivityLogEntry | null>(null)

  const {
    stays: activeStays,
    addPayment,
    addService,
    addMinibar,
    transfer,
    extend,
  } = useStays({ status: 'active' })

  const stayForSelectedRoom = useMemo(() => {
    if (!selectedRoom) return null
    return (activeStays as Stay[]).find((s) =>
      (s.stay_rooms ?? []).some((sr) => sr.room?.id === selectedRoom.id && sr.is_active !== false),
    ) ?? null
  }, [activeStays, selectedRoom])

  const staysWithBalance = useMemo(
    () => (activeStays as Stay[])
      .map((s) => {
        const total = Number(s.total_amount ?? 0)
        const paid = Number(s.paid_amount ?? 0)
        return { stay: s, total, paid, balance: total - paid }
      })
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance),
    [activeStays],
  )

  const occupancyPct = stats && stats.total_rooms > 0
    ? Math.round((stats.occupied / stats.total_rooms) * 100)
    : 0

  const handleRoomStatusChange = (id: string, status: RoomStatus, notes?: string) => {
    changeStatus(
      { id, status, notes },
      { onSuccess: () => setSelectedRoom(null) },
    )
  }

  const handleResolveAlert = (n: AppNotification) => {
    if (!isPersistentRoomAlert(n.type)) {
      markNotificationRead(n.id)
    }

    if (n.type === 'room_inconsistency' || n.type === 'room_cleaning') {
      const roomId = (n.payload as { room_id?: string } | null)?.room_id
      const room = rooms.find((r) => r.id === roomId)
      if (room) {
        setSelectedRoom(room)
        return
      }
    }

    if (n.type === 'room_maintenance') {
      const roomId = (n.payload as { room_id?: string } | null)?.room_id
      if (roomId) {
        navigate(`/inventory?tab=reparaciones&room_id=${roomId}`)
        return
      }
    }

    if (n.type === 'stay_void_request') {
      const voidRequestId = (n.payload as { void_request_id?: string } | null)?.void_request_id
      if (voidRequestId) {
        setReviewVoidId(voidRequestId)
        return
      }
    }

    if (n.action_url) navigate(n.action_url)
  }

  return {
    stats,
    isLoading,
    rooms,
    loadingRooms,
    isChanging,
    housekeepers,
    canViewActivity,
    canCheckOut,
    activityLogs: activityData?.data ?? [],
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
    isRequestingVoid: isRequesting,
    canApproveVoid,
    pendingVoidTotal,
    pendingVoidRequests,
    reviewVoidId,
    setReviewVoidId,
    approveVoid: approve,
    rejectVoid: reject,
    isApprovingVoid: isApproving,
    isRejectingVoid: isRejecting,
  }
}
