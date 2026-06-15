<?php

use App\Http\Controllers\Api\V1\MinibarController;
use Illuminate\Support\Facades\Route;

// Catálogo de productos del minibar y stock por habitación — lecturas
// accesibles al staff que hace check-in/out para cargar consumos desde
// la estadía, aunque no tenga permiso para ver el módulo de Inventario.
Route::get('/inventory/minibar/products', [MinibarController::class, 'productsIndex'])
     ->middleware('permission:view_inventory|manage_inventory|check_in|check_out');
Route::get('/inventory/minibar/room-minibars', [MinibarController::class, 'roomMinibars'])
     ->middleware('permission:view_inventory|manage_inventory|check_in|check_out');
