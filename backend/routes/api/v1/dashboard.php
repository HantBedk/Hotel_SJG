<?php

use App\Http\Controllers\Api\V1\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', [DashboardController::class, 'index'])
     ->middleware('permission:view_dashboard');
Route::get('/dashboard/occupancy-history', [DashboardController::class, 'occupancyHistory'])
     ->middleware('permission:view_dashboard');
