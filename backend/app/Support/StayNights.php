<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Noches de estadía: diferencia en días calendario entre entrada y salida.
 * Ej.: check-in 15 jun 15:27, check-out 18 jun 12:00 → 3 noches.
 */
final class StayNights
{
    public static function between(Carbon|string $checkIn, Carbon|string $checkOut): int
    {
        $in  = $checkIn instanceof Carbon ? $checkIn->copy() : Carbon::parse($checkIn);
        $out = $checkOut instanceof Carbon ? $checkOut->copy() : Carbon::parse($checkOut);

        $nights = (int) $in->startOfDay()->diffInDays($out->startOfDay());

        return max(1, $nights);
    }
}
