<?php

namespace App\Support;

use App\Models\User;

class AuthUserPayload
{
    public static function build(User $user): array
    {
        $user->loadMissing('persona');

        $hotels = HotelAccess::accessibleHotels($user)->map(fn ($h) => [
            'id'       => $h->id,
            'name'     => $h->name,
            'city'     => $h->city,
            'logo_url' => $h->logo_url,
        ])->values();

        return [
            'id'               => $user->id,
            'person_id'        => $user->person_id,
            'name'             => $user->name,
            'email'            => $user->email,
            'roles'            => $user->getRoleNames(),
            'permissions'      => $user->getAllPermissions()->pluck('name'),
            'hotels'           => $hotels,
            'can_switch_hotel' => HotelAccess::canSwitchHotel($user),
            'current_hotel_id' => TenantContext::id() ?? HotelAccess::defaultHotelId($user),
        ];
    }
}
