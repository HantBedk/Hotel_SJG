<?php

use App\Http\Controllers\Api\V1\NationalityController;
use Illuminate\Support\Facades\Route;

Route::get('/nationalities', [NationalityController::class, 'index'])
    ->middleware('permission:view_reservations|manage_reservations|check_in|manage_users');
