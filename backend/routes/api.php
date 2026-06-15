<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

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
    require __DIR__ . '/api/v1.php';
});
