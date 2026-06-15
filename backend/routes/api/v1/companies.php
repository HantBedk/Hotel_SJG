<?php

use App\Http\Controllers\Api\V1\CompanyController;
use Illuminate\Support\Facades\Route;

const COMPANY_ROUTE = '/companies/{company}';

Route::get('/companies',    [CompanyController::class, 'index'])
     ->middleware('permission:view_reservations|manage_reservations|check_in');
Route::post('/companies',   [CompanyController::class, 'store'])
     ->middleware('permission:manage_reservations|check_in');
Route::get(COMPANY_ROUTE,    [CompanyController::class, 'show'])
     ->middleware('permission:view_reservations|manage_reservations|check_in');
Route::put(COMPANY_ROUTE,    [CompanyController::class, 'update'])
     ->middleware('permission:manage_reservations');
Route::delete(COMPANY_ROUTE, [CompanyController::class, 'destroy'])
     ->middleware('permission:manage_reservations');
