<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SettingsController;
use Illuminate\Support\Facades\Route;

Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me',      [AuthController::class, 'me']);

Route::get('/ping', fn () => response()->json([
    'success' => true,
    'data'    => ['status' => 'ok', 'timestamp' => now()->toIso8601String()],
    'message' => 'Sistema activo.',
    'errors'  => [],
]));

Route::get('/settings', [SettingsController::class, 'index']);
Route::put('/settings', [SettingsController::class, 'update'])
     ->middleware('permission:manage_settings');
