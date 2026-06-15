<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Middleware\SetCurrentHotel;
use Illuminate\Support\Facades\Route;

Route::post('/login',           [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

Route::middleware(['auth:sanctum', SetCurrentHotel::class])->group(function () {
    require __DIR__ . '/v1/auth-session.php';
    require __DIR__ . '/v1/dashboard.php';
    require __DIR__ . '/v1/rooms.php';
    require __DIR__ . '/v1/guests.php';
    require __DIR__ . '/v1/nationalities.php';
    require __DIR__ . '/v1/companies.php';
    require __DIR__ . '/v1/stays.php';
    require __DIR__ . '/v1/reservations.php';
    require __DIR__ . '/v1/inventory-shared.php';
    require __DIR__ . '/v1/inventory.php';
    require __DIR__ . '/v1/minibar-sales.php';
    require __DIR__ . '/v1/notifications.php';
    require __DIR__ . '/v1/activity.php';
    require __DIR__ . '/v1/income.php';
    require __DIR__ . '/v1/suggestions.php';
    require __DIR__ . '/v1/admin-hotels.php';
    require __DIR__ . '/v1/admin.php';
});
