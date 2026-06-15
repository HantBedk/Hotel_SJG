<?php

use App\Support\HotelAccess;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — Hotel Manager (multitenant)
|--------------------------------------------------------------------------
*/

Broadcast::channel('hotel.{hotelId}.rooms', function ($user, string $hotelId) {
    return $user && HotelAccess::canAccess($user, $hotelId);
});

Broadcast::channel('hotel.{hotelId}.notifications', function ($user, string $hotelId) {
    return $user && HotelAccess::canAccess($user, $hotelId);
});

Broadcast::channel('hotel.{hotelId}.reservations', function ($user, string $hotelId) {
    return $user
        && HotelAccess::canAccess($user, $hotelId)
        && $user->hasAnyRole(['superadmin', 'admin', 'receptionist']);
});

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});
