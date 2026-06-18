<?php

namespace App\Support;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use App\Models\StayRoom;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/** Resuelve estadías abiertas por habitación (misma lógica que ocupación del dashboard). */
class RoomStayResolver
{
    public static function currentStay(Room $room, ?Carbon $date = null): ?Stay
    {
        $dateStr = ($date ?? today())->toDateString();

        $stayRoom = StayRoom::query()
            ->where('room_id', $room->id)
            ->where('is_active', true)
            ->whereDate('check_in_date', '<=', $dateStr)
            ->whereHas('stay', fn (Builder $q) => self::applyOpenStayOnDate($q, $dateStr))
            ->first();

        return $stayRoom?->stay;
    }

    public static function hasOpenStay(Room $room, ?Carbon $date = null): bool
    {
        $dateStr = ($date ?? today())->toDateString();

        return StayRoom::query()
            ->where('room_id', $room->id)
            ->where('is_active', true)
            ->whereDate('check_in_date', '<=', $dateStr)
            ->whereHas('stay', fn (Builder $q) => self::applyOpenStayOnDate($q, $dateStr))
            ->exists();
    }

    public static function hasActiveReservation(Room $room, ?Carbon $date = null): bool
    {
        $dateStr = ($date ?? today())->toDateString();

        return Reservation::query()
            ->where('room_id', $room->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->exists();
    }

    public static function isConsistent(Room $room, ?Carbon $date = null): bool
    {
        if (! in_array($room->status, ['occupied', 'reserved'], true)) {
            return true;
        }

        return self::hasOpenStay($room, $date)
            || self::hasActiveReservation($room, $date);
    }

    /**
     * @param  Builder<Stay>  $query
     */
    public static function applyOpenStayOnDate(Builder $query, string $dateStr): void
    {
        $query->whereIn('status', Stay::OPEN_STATUSES)
            ->whereDate('check_out_datetime', '>=', $dateStr);
    }
}
