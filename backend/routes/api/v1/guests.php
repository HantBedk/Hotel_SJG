<?php

use App\Http\Controllers\Api\V1\GuestController;
use Illuminate\Support\Facades\Route;

const GUEST_ROUTE = '/guests/{guest}';

Route::get('/guests',    [GuestController::class, 'index'])
     ->middleware('permission:view_reservations|manage_reservations|check_in');
Route::post('/guests',   [GuestController::class, 'store'])
     ->middleware('permission:manage_reservations|check_in');
Route::get(GUEST_ROUTE,    [GuestController::class, 'show'])
     ->middleware('permission:view_reservations|manage_reservations|check_in');
Route::put(GUEST_ROUTE,    [GuestController::class, 'update'])
     ->middleware('permission:manage_reservations|check_in');
Route::delete(GUEST_ROUTE, [GuestController::class, 'destroy'])
     ->middleware('permission:manage_reservations');
Route::get('/guests/{guest}/companions',         [GuestController::class, 'companions'])
     ->middleware('permission:view_reservations|manage_reservations|check_in');
Route::post('/guests/{guest}/companions',        [GuestController::class, 'storeCompanion'])
     ->middleware('permission:manage_reservations|check_in');
Route::delete('/guests/{guest}/companions/{companion}', [GuestController::class, 'destroyCompanion'])
     ->middleware('permission:manage_reservations');
Route::get('/guests/{guest}/stays', [GuestController::class, 'stays'])
     ->middleware('permission:view_reservations|manage_reservations|check_in');
