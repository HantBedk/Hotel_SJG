<?php

namespace App\Support;

use App\Models\Stay;
use App\Models\StayRoom;

class StayRoomOccupancy
{
    public function isOccupiedOnDate(StayRoom $stayRoom, string $dateStr): bool
    {
        $checkIn  = $stayRoom->check_in_date->format('Y-m-d');
        $checkOut = $stayRoom->check_out_date->format('Y-m-d');

        if ($checkIn > $dateStr || $checkOut <= $dateStr) {
            return false;
        }

        $status = $stayRoom->stay?->status;
        if (in_array($status, Stay::OPEN_STATUSES, true)) {
            return true;
        }

        $actual = $stayRoom->stay?->actual_check_out_datetime;

        return $status === Stay::STATUS_CHECKED_OUT
            && $actual !== null
            && $actual->format('Y-m-d') >= $dateStr;
    }
}
