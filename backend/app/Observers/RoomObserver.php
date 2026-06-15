<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Room;
use Illuminate\Support\Facades\Auth;

/** Garantiza auditoría al crear habitación desde cualquier flujo (admin u operativo). */
class RoomObserver
{
    public function created(Room $room): void
    {
        $userId = Auth::id();
        if (! $userId) {
            return;
        }

        ActivityLog::record('room_created', $userId, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
        ]);
    }
}
