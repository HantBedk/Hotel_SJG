<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Collection;

/** Alertas de limpieza pendiente para personal operativo. */
class RoomCleaningNotifier
{
    public static function notify(Room $room, string $message, ?string $excludeUserId = null): void
    {
        if (! Setting::get('hotel.cleaning_alerts', true)) {
            return;
        }

        $recipientIds = self::recipientIds($room, $excludeUserId);
        if ($recipientIds->isEmpty()) {
            return;
        }

        foreach ($recipientIds as $userId) {
            if (self::hasPendingAlert($userId, $room->id)) {
                continue;
            }

            Notification::create([
                'type'       => 'room_cleaning',
                'title'      => "Limpieza pendiente: Hab. {$room->number}",
                'message'    => $message,
                'severity'   => 'info',
                'payload'    => [
                    'room_id'     => $room->id,
                    'room_number' => $room->number,
                    'hotel_id'    => $room->hotel_id,
                ],
                'action_url' => '/',
                'user_id'    => $userId,
            ]);
        }
    }

    public static function dismissForRoom(string $roomId): void
    {
        Notification::query()
            ->where('type', 'room_cleaning')
            ->where('is_read', false)
            ->whereJsonContains('payload->room_id', $roomId)
            ->update(['is_read' => true, 'read_at' => now()]);
    }

    private static function recipientIds(Room $room, ?string $excludeUserId): Collection
    {
        $ids = AlertRecipients::forHotel($room->hotel_id)
            ->merge(
                User::role('housekeeping')
                    ->where('is_active', true)
                    ->whereHas('hotels', fn ($q) => $q->where('hotels.id', $room->hotel_id))
                    ->pluck('id'),
            )
            ->merge(
                User::permission('manage_rooms')
                    ->where('is_active', true)
                    ->whereHas('hotels', fn ($q) => $q->where('hotels.id', $room->hotel_id))
                    ->pluck('id'),
            )
            ->unique()
            ->values();

        if ($excludeUserId) {
            $ids = $ids->reject(fn ($id) => $id === $excludeUserId)->values();
        }

        return $ids;
    }

    private static function hasPendingAlert(string $userId, string $roomId): bool
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->where('type', 'room_cleaning')
            ->where('is_read', false)
            ->whereJsonContains('payload->room_id', $roomId)
            ->exists();
    }
}
