<?php

namespace App\Support;

use App\Models\Notification;

/** Alertas de habitación marcada ocupada/reservada sin respaldo en BD. */
class RoomInconsistencyNotifier
{
    public static function dismissForRoom(string $roomId): void
    {
        Notification::query()
            ->where('type', 'room_inconsistency')
            ->where('is_read', false)
            ->whereJsonContains('payload->room_id', $roomId)
            ->update(['is_read' => true, 'read_at' => now()]);
    }

    /**
     * @param  array<int, string>  $roomIds
     */
    public static function dismissForRooms(array $roomIds): void
    {
        foreach (array_unique($roomIds) as $roomId) {
            self::dismissForRoom($roomId);
        }
    }
}
