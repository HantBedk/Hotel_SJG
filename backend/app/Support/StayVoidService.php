<?php

namespace App\Support;

use App\Events\RoomStatusChanged;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Room;
use App\Models\Stay;
use App\Models\StayVoidRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class StayVoidService
{
    public function requestVoid(Stay $stay, User $requester, string $reason): StayVoidRequest
    {
        abort_if(
            ! $stay->isOpen(),
            409,
            'Solo se puede solicitar anulación de estadías activas o extendidas.',
        );

        abort_if(
            StayVoidRequest::where('stay_id', $stay->id)->pending()->exists(),
            409,
            'Ya existe una solicitud de anulación pendiente para esta estadía.',
        );

        return DB::transaction(function () use ($stay, $requester, $reason) {
            $stay = Stay::whereKey($stay->id)->lockForUpdate()->firstOrFail();

            abort_if(
                ! $stay->isOpen(),
                409,
                'Solo se puede solicitar anulación de estadías activas o extendidas.',
            );

            $voidRequest = StayVoidRequest::create([
                'hotel_id'        => $stay->hotel_id,
                'stay_id'         => $stay->id,
                'requested_by_id' => $requester->id,
                'reason'          => $reason,
                'status'          => StayVoidRequest::STATUS_PENDING,
            ]);

            $today = today()->toDateString();
            $roomNumbers = [];

            foreach ($stay->activeStayRooms()->with('room')->lockForUpdate()->get() as $stayRoom) {
                $stayRoom->update([
                    'is_active'      => false,
                    'check_out_date' => $today,
                ]);

                $room = Room::whereKey($stayRoom->room_id)->lockForUpdate()->first();
                if ($room) {
                    $room->update(['status' => Room::STATUS_AVAILABLE]);
                    $roomNumbers[] = $room->number;
                    broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
                }
            }

            $stay->update(['status' => Stay::STATUS_VOID_PENDING]);

            ActivityLog::record('stay.void_requested', $requester->id, [
                'stay_id'      => $stay->id,
                'void_request_id' => $voidRequest->id,
                'guest_name'   => $stay->guest?->full_name,
                'rooms'        => $roomNumbers,
                'reason'       => $reason,
            ]);

            $this->notifyApprovers($voidRequest, $requester);

            return $voidRequest->load([
                'stay.guest',
                'stay.stayRooms.room',
                'requestedBy.persona',
            ]);
        });
    }

    public function approve(StayVoidRequest $voidRequest, User $reviewer, ?string $adminNotes = null): StayVoidRequest
    {
        $this->assertPending($voidRequest);

        return DB::transaction(function () use ($voidRequest, $reviewer, $adminNotes) {
            $voidRequest = StayVoidRequest::whereKey($voidRequest->id)->lockForUpdate()->firstOrFail();
            $this->assertPending($voidRequest);

            $stay = Stay::whereKey($voidRequest->stay_id)->lockForUpdate()->firstOrFail();

            $voidRequest->update([
                'status'         => StayVoidRequest::STATUS_APPROVED,
                'reviewed_by_id' => $reviewer->id,
                'admin_notes'    => $adminNotes,
                'reviewed_at'    => now(),
            ]);

            $stay->update(['status' => Stay::STATUS_VOIDED]);

            ActivityLog::record('stay.void_approved', $reviewer->id, [
                'stay_id'         => $stay->id,
                'void_request_id' => $voidRequest->id,
                'guest_name'      => $stay->guest?->full_name,
                'admin_notes'     => $adminNotes,
            ]);

            $this->notifyRequester(
                $voidRequest,
                'Anulación aprobada',
                'Tu solicitud de anulación fue aprobada por un administrador.',
                'stay_void_approved',
            );

            return $voidRequest->fresh([
                'stay.guest',
                'stay.stayRooms.room',
                'requestedBy.persona',
                'reviewedBy.persona',
            ]);
        });
    }

    public function reject(StayVoidRequest $voidRequest, User $reviewer, ?string $adminNotes = null): StayVoidRequest
    {
        $this->assertPending($voidRequest);

        return DB::transaction(function () use ($voidRequest, $reviewer, $adminNotes) {
            $voidRequest = StayVoidRequest::whereKey($voidRequest->id)->lockForUpdate()->firstOrFail();
            $this->assertPending($voidRequest);

            $stay = Stay::whereKey($voidRequest->stay_id)->lockForUpdate()->firstOrFail();

            $voidRequest->update([
                'status'         => StayVoidRequest::STATUS_REJECTED,
                'reviewed_by_id' => $reviewer->id,
                'admin_notes'    => $adminNotes,
                'reviewed_at'    => now(),
            ]);

            $stay->update(['status' => Stay::STATUS_VOID_REJECTED]);

            ActivityLog::record('stay.void_rejected', $reviewer->id, [
                'stay_id'         => $stay->id,
                'void_request_id' => $voidRequest->id,
                'guest_name'      => $stay->guest?->full_name,
                'admin_notes'     => $adminNotes,
            ]);

            $this->notifyRequester(
                $voidRequest,
                'Anulación rechazada',
                'Tu solicitud de anulación fue rechazada. La habitación permanece disponible.',
                'stay_void_rejected',
            );

            return $voidRequest->fresh([
                'stay.guest',
                'stay.stayRooms.room',
                'requestedBy.persona',
                'reviewedBy.persona',
            ]);
        });
    }

    private function assertPending(StayVoidRequest $voidRequest): void
    {
        abort_if(
            ! $voidRequest->isPending(),
            409,
            'Esta solicitud de anulación ya fue resuelta.',
        );
    }

    private function notifyApprovers(StayVoidRequest $voidRequest, User $requester): void
    {
        $stay = $voidRequest->stay ?? Stay::with('guest')->find($voidRequest->stay_id);
        $guestName = $stay?->guest?->full_name ?? 'Huésped';
        $rooms = $stay?->stayRooms?->pluck('room.number')->filter()->values()->all() ?? [];

        $approverIds = User::permission('approve_stay_void')
            ->where('id', '!=', $requester->id)
            ->pluck('id');

        foreach ($approverIds as $userId) {
            Notification::create([
                'type'       => 'stay_void_request',
                'title'      => 'Solicitud de anulación de estadía',
                'message'    => "{$requester->name} solicita anular la estadía de {$guestName}.",
                'severity'   => 'warning',
                'payload'    => [
                    'void_request_id' => $voidRequest->id,
                    'stay_id'         => $voidRequest->stay_id,
                    'guest_name'      => $guestName,
                    'rooms'           => $rooms,
                    'reason'          => $voidRequest->reason,
                ],
                'action_url' => '/stays?void_request=' . $voidRequest->id,
                'user_id'    => $userId,
            ]);
        }
    }

    private function notifyRequester(
        StayVoidRequest $voidRequest,
        string $title,
        string $message,
        string $type,
    ): void {
        Notification::create([
            'type'       => $type,
            'title'      => $title,
            'message'    => $message,
            'severity'   => $type === 'stay_void_rejected' ? 'warning' : 'info',
            'payload'    => [
                'void_request_id' => $voidRequest->id,
                'stay_id'         => $voidRequest->stay_id,
                'admin_notes'     => $voidRequest->admin_notes,
            ],
            'action_url' => '/stays?id=' . $voidRequest->stay_id,
            'user_id'    => $voidRequest->requested_by_id,
        ]);
    }
}
