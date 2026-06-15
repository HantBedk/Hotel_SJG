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

    /** @param  array<int, string>  $roles */
    public static function rolesRequireHotels(array $roles): bool
    {
        if (in_array('superadmin', $roles, true)) {
            return false;
        }

        $staffRoles = ['admin', 'receptionist', 'housekeeping', 'maintenance'];

        return count(array_intersect($roles, $staffRoles)) > 0;
    }

    /**
     * Sincroniza hoteles de un usuario según los roles de su persona.
     *
     * @param  array<int, string>  $roles
     * @param  array<int, string>  $hotelIds
     */
    public static function syncHotelsForRoles(User $user, array $roles, array $hotelIds, User $actor): void
    {
        if (in_array('superadmin', $roles, true)) {
            $user->hotels()->detach();

            return;
        }

        if (! self::rolesRequireHotels($roles)) {
            $user->hotels()->detach();

            return;
        }

        abort_if($hotelIds === [], 422, 'Asigna al menos un hotel para roles de personal.');

        if (! self::isSuperAdmin($actor)) {
            foreach ($hotelIds as $hotelId) {
                abort_unless(
                    self::canAccess($actor, $hotelId),
                    403,
                    'No puedes asignar un hotel al que no tienes acceso.',
                );
            }
        }

        $user->hotels()->sync($hotelIds);
    }
}
