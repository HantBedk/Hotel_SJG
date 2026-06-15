<?php

use App\Http\Controllers\Api\V1\Admin\AdminHotelController;
use Illuminate\Support\Facades\Route;

Route::get('/admin/hotel', [AdminHotelController::class, 'getHotelInfo']);

Route::get('/admin/hotels', [AdminHotelController::class, 'indexHotels'])
     ->middleware('permission:view_hotels');
