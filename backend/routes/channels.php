<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — Hotel Manager
|--------------------------------------------------------------------------
| Todos los canales son privados (requieren autenticación con Sanctum).
| Los canales públicos no se usan (sistema offline, todos autenticados).
*/

// Canal de habitaciones: cualquier usuario autenticado puede suscribirse
Broadcast::channel('hotel.rooms', function ($user) {
    return $user !== null;
});

// Canal de notificaciones: cualquier usuario autenticado
Broadcast::channel('hotel.notifications', function ($user) {
    return $user !== null;
});

// Canal de reservaciones: solo admin y recepcionista
Broadcast::channel('hotel.reservations', function ($user) {
    return $user->hasAnyRole(['superadmin', 'admin', 'receptionist']);
});

// Canal personal por usuario (notificaciones privadas)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});
