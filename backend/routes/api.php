<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExtraServiceController;
use App\Http\Controllers\Api\V1\GuestController;
use App\Http\Controllers\Api\V1\ReservationController;
use App\Http\Controllers\Api\V1\RoomController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\StayController;

/*
|--------------------------------------------------------------------------
| API Routes — Hotel Manager v1
|--------------------------------------------------------------------------
*/

// Broadcasting auth fuera del prefijo v1 (Laravel Echo usa /broadcasting/auth por defecto)
Route::middleware('auth:sanctum')->group(function () {
    Broadcast::routes();
});

Route::prefix('v1')->group(function () {

    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);

        Route::get('/ping', fn() => response()->json([
            'success' => true,
            'data'    => ['status' => 'ok', 'timestamp' => now()->toIso8601String()],
            'message' => 'Sistema activo.',
            'errors'  => [],
        ]));

        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update'])
             ->middleware('permission:manage_settings');

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])
             ->middleware('permission:view_dashboard');

        // Habitaciones
        Route::get('/room-types', [RoomController::class, 'types'])
             ->middleware('permission:view_rooms');
        Route::get('/rooms', [RoomController::class, 'index'])
             ->middleware('permission:view_rooms');
        Route::post('/rooms', [RoomController::class, 'store'])
             ->middleware('permission:manage_rooms');
        Route::get('/rooms/{room}', [RoomController::class, 'show'])
             ->middleware('permission:view_rooms');
        Route::put('/rooms/{room}', [RoomController::class, 'update'])
             ->middleware('permission:manage_rooms');
        Route::patch('/rooms/{room}/status', [RoomController::class, 'updateStatus'])
             ->middleware('permission:manage_rooms|check_in');
        Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])
             ->middleware('permission:manage_rooms');

        // Huéspedes
        Route::get('/guests',    [GuestController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/guests',   [GuestController::class, 'store'])
             ->middleware('permission:manage_reservations|check_in');
        Route::get('/guests/{guest}',    [GuestController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::put('/guests/{guest}',    [GuestController::class, 'update'])
             ->middleware('permission:manage_reservations|check_in');
        Route::delete('/guests/{guest}', [GuestController::class, 'destroy'])
             ->middleware('permission:manage_reservations');
        Route::get('/guests/{guest}/companions',         [GuestController::class, 'companions'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/guests/{guest}/companions',        [GuestController::class, 'storeCompanion'])
             ->middleware('permission:manage_reservations|check_in');
        Route::delete('/guests/{guest}/companions/{companion}', [GuestController::class, 'destroyCompanion'])
             ->middleware('permission:manage_reservations');
        Route::get('/guests/{guest}/stays', [GuestController::class, 'stays'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');

        // Empresas
        Route::get('/companies',    [CompanyController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/companies',   [CompanyController::class, 'store'])
             ->middleware('permission:manage_reservations|check_in');
        Route::get('/companies/{company}',    [CompanyController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::put('/companies/{company}',    [CompanyController::class, 'update'])
             ->middleware('permission:manage_reservations');
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])
             ->middleware('permission:manage_reservations');

        // Estadías (Check-in / Check-out)
        Route::get('/stays',    [StayController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/stays',   [StayController::class, 'store'])
             ->middleware('permission:check_in');
        Route::get('/stays/{stay}',  [StayController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::patch('/stays/{stay}/checkout',  [StayController::class, 'checkout'])
             ->middleware('permission:check_out');
        Route::get('/stays/{stay}/account',     [StayController::class, 'account'])
             ->middleware('permission:check_out|check_in|manage_reservations');
        Route::get('/stays/{stay}/receipt',     [StayController::class, 'receipt'])
             ->middleware('permission:check_out|check_in|manage_reservations');
        Route::post('/stays/{stay}/extend',     [StayController::class, 'extend'])
             ->middleware('permission:check_out|check_in');
        Route::post('/stays/{stay}/add-room',   [StayController::class, 'addRoom'])
             ->middleware('permission:check_in');
        Route::post('/stays/{stay}/minibar',    [StayController::class, 'minibarCharges'])
             ->middleware('permission:check_out|check_in');
        Route::post('/stays/{stay}/transfer',   [StayController::class, 'transfer'])
             ->middleware('permission:check_in|check_out');
        Route::post('/stays/{stay}/payments',   [StayController::class, 'addPayment'])
             ->middleware('permission:check_in|check_out|manage_reservations');
        Route::post('/stays/{stay}/services',   [StayController::class, 'addService'])
             ->middleware('permission:check_in|check_out|manage_reservations');

        // Servicios extra (catálogo)
        Route::get('/extra-services', [ExtraServiceController::class, 'index'])
             ->middleware('permission:check_in|check_out|manage_reservations');

        // Reservas
        Route::get('/reservations', [ReservationController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations');
        Route::post('/reservations', [ReservationController::class, 'store'])
             ->middleware('permission:manage_reservations');
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations');
        Route::put('/reservations/{reservation}', [ReservationController::class, 'update'])
             ->middleware('permission:manage_reservations');
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy'])
             ->middleware('permission:manage_reservations');
        Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])
             ->middleware('permission:manage_reservations');
        Route::patch('/reservations/{reservation}/extend', [ReservationController::class, 'extend'])
             ->middleware('permission:manage_reservations');
        Route::post('/reservations/{reservation}/check-in', [ReservationController::class, 'checkIn'])
             ->middleware('permission:check_in');
        Route::post('/reservations/{reservation}/payments', [ReservationController::class, 'addPayment'])
             ->middleware('permission:manage_reservations|check_in');

        // Calendario
        Route::get('/calendar', [CalendarController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|view_rooms');
    });
});
