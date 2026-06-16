<?php

use App\Http\Controllers\Api\V1\StayVoidRequestController;
use Illuminate\Support\Facades\Route;

Route::post('/stays/{stay}/void-request', [StayVoidRequestController::class, 'store'])
    ->middleware('permission:request_stay_void');

Route::get('/stay-void-requests', [StayVoidRequestController::class, 'index'])
    ->middleware('permission:approve_stay_void');

Route::get('/stay-void-requests/{stayVoidRequest}', [StayVoidRequestController::class, 'show'])
    ->middleware('permission:request_stay_void|approve_stay_void');

Route::patch('/stay-void-requests/{stayVoidRequest}/approve', [StayVoidRequestController::class, 'approve'])
    ->middleware('permission:approve_stay_void');

Route::patch('/stay-void-requests/{stayVoidRequest}/reject', [StayVoidRequestController::class, 'reject'])
    ->middleware('permission:approve_stay_void');
