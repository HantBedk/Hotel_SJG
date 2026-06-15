<?php

namespace App\Support;

use App\Models\Hotel;

class TenantContext
{
    private static ?string $hotelId = null;

    private static ?Hotel $hotel = null;

    public static function set(?string $hotelId): void
    {
        self::$hotelId = $hotelId;
        self::$hotel   = null;
    }

    public static function id(): ?string
    {
        return self::$hotelId;
    }

    public static function hotel(): ?Hotel
    {
        if (! self::$hotelId) {
            return null;
        }

        return self::$hotel ??= Hotel::find(self::$hotelId);
    }

    public static function requireId(): string
    {
        if (! self::$hotelId) {
            abort(400, 'Selecciona un hotel activo (header X-Hotel-Id).');
        }

        return self::$hotelId;
    }
}
