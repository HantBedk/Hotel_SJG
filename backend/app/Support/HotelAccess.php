<?php

namespace App\Support;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Collection;

class HotelAccess
{
    public static function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('superadmin');
    }

    public static function accessibleHotels(User $user): Collection
    {
        if (self::isSuperAdmin($user)) {
            return Hotel::orderBy('name')->get();
        }

        return $user->hotels()->orderBy('hotels.name')->get();
    }

    public static function canAccess(User $user, string $hotelId): bool
    {
        if (self::isSuperAdmin($user)) {
            return Hotel::whereKey($hotelId)->exists();
        }

        return $user->hotels()->where('hotels.id', $hotelId)->exists();
    }

    public static function canSwitchHotel(User $user): bool
    {
        if (self::isSuperAdmin($user)) {
            return Hotel::count() > 1;
        }

        return $user->hotels()->count() > 1;
    }

    public static function defaultHotelId(User $user): ?string
    {
        $hotels = self::accessibleHotels($user);

        return $hotels->first()?->id;
    }
}
