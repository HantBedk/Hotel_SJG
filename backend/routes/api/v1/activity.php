<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:view_activity_log')->group(function () {
    Route::get('/activity-logs',         [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/actions', [ActivityLogController::class, 'actions']);
    Route::get('/reports/payments',      [ActivityLogController::class, 'payments']);
});
