<?php

use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\ReservationController;
use Illuminate\Support\Facades\Route;

const RESERVATION_ROUTE = '/reservations/{reservation}';

Route::get('/reservations', [ReservationController::class, 'index'])
     ->middleware('permission:view_reservations|manage_reservations');
Route::post('/reservations', [ReservationController::class, 'store'])
     ->middleware('permission:manage_reservations');
Route::post('/reservations/bulk', [ReservationController::class, 'bulkStore'])
     ->middleware('permission:manage_reservations');
Route::get(RESERVATION_ROUTE, [ReservationController::class, 'show'])
     ->middleware('permission:view_reservations|manage_reservations');
Route::put(RESERVATION_ROUTE, [ReservationController::class, 'update'])
     ->middleware('permission:manage_reservations');
Route::delete(RESERVATION_ROUTE, [ReservationController::class, 'destroy'])
     ->middleware('permission:manage_reservations');
Route::patch(RESERVATION_ROUTE . '/cancel', [ReservationController::class, 'cancel'])
     ->middleware('permission:manage_reservations');
Route::patch(RESERVATION_ROUTE . '/extend', [ReservationController::class, 'extend'])
     ->middleware('permission:manage_reservations');
Route::post(RESERVATION_ROUTE . '/check-in', [ReservationController::class, 'checkIn'])
     ->middleware('permission:check_in');
Route::post(RESERVATION_ROUTE . '/payments', [ReservationController::class, 'addPayment'])
     ->middleware('permission:manage_reservations|check_in');
Route::patch(RESERVATION_ROUTE . '/payments/{payment}/cancel', [ReservationController::class, 'cancelPayment'])
     ->middleware('permission:manage_reservations|check_in');

Route::get('/calendar', [CalendarController::class, 'index'])
     ->middleware('permission:view_reservations|manage_reservations|view_rooms');
