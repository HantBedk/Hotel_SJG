<?php

use App\Http\Controllers\Api\V1\ExtraServiceController;
use App\Http\Controllers\Api\V1\StayController;
use Illuminate\Support\Facades\Route;

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
Route::get('/stays/{stay}/checkin-receipt', [StayController::class, 'checkInReceipt'])
     ->middleware('permission:check_out|check_in|manage_reservations');
Route::post('/stays/{stay}/extend',     [StayController::class, 'extend'])
     ->middleware('permission:check_out|check_in');
Route::post('/stays/{stay}/add-room',   [StayController::class, 'addRoom'])
     ->middleware('permission:check_in');
Route::post('/stays/{stay}/minibar',    [StayController::class, 'minibarCharges'])
     ->middleware('permission:check_out|check_in');
Route::delete('/stays/{stay}/minibar/{consumption}', [StayController::class, 'cancelMinibarConsumption'])
     ->middleware('permission:check_out|check_in|manage_reservations');
Route::post('/stays/{stay}/transfer',   [StayController::class, 'transfer'])
     ->middleware('permission:check_in|check_out');
Route::get('/stays/{stay}/payments',    [StayController::class, 'payments'])
     ->middleware('permission:check_in|check_out|manage_reservations');
Route::post('/stays/{stay}/payments',   [StayController::class, 'addPayment'])
     ->middleware('permission:check_in|check_out|manage_reservations');
Route::patch('/stays/{stay}/payments/{payment}/cancel', [StayController::class, 'cancelPayment'])
     ->middleware('permission:check_in|check_out|manage_reservations');
Route::post('/stays/{stay}/services',   [StayController::class, 'addService'])
     ->middleware('permission:check_in|check_out|manage_reservations');

Route::get('/extra-services', [ExtraServiceController::class, 'index'])
     ->middleware('permission:check_in|check_out|manage_reservations');
