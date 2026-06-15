<?php

use App\Http\Controllers\Api\V1\RoomController;
use Illuminate\Support\Facades\Route;

const ROOM_ROUTE = '/rooms/{room}';

Route::get('/room-types', [RoomController::class, 'types'])
     ->middleware('permission:view_rooms');
Route::get('/housekeepers', [RoomController::class, 'housekeepers'])
     ->middleware('permission:view_rooms');
Route::get('/rooms', [RoomController::class, 'index'])
     ->middleware('permission:view_rooms');
Route::post('/rooms', [RoomController::class, 'store'])
     ->middleware('permission:manage_rooms');
Route::get(ROOM_ROUTE, [RoomController::class, 'show'])
     ->middleware('permission:view_rooms');
Route::put(ROOM_ROUTE, [RoomController::class, 'update'])
     ->middleware('permission:manage_rooms');
Route::patch(ROOM_ROUTE . '/status', [RoomController::class, 'updateStatus'])
     ->middleware('permission:manage_rooms|check_in');
Route::delete(ROOM_ROUTE, [RoomController::class, 'destroy'])
     ->middleware('permission:manage_rooms');
