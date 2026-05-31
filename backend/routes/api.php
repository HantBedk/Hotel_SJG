<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SettingsController;

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
    });
});
