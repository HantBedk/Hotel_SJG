<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes — Hotel Manager v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Autenticación pública ────────────────────────────────────────────────
    Route::post('/login', [AuthController::class, 'login']);

    // ── Rutas protegidas con Sanctum ─────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',     [AuthController::class, 'me']);

        // Health check del sistema (solo autenticado)
        Route::get('/ping', fn() => response()->json([
            'success' => true,
            'data'    => ['status' => 'ok', 'timestamp' => now()->toIso8601String()],
            'message' => 'Sistema activo.',
            'errors'  => [],
        ]));
    });
});
