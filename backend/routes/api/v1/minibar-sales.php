<?php

use App\Http\Controllers\Api\V1\MinibarSaleController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:manage_inventory|check_in|check_out')->group(function () {
    Route::get   ('/minibar-sales',                       [MinibarSaleController::class, 'index']);
    Route::post  ('/minibar-sales',                       [MinibarSaleController::class, 'store']);
    Route::get   ('/minibar-sales/{minibarSale}',         [MinibarSaleController::class, 'show']);
    Route::delete('/minibar-sales/{minibarSale}',         [MinibarSaleController::class, 'destroy']);
    Route::post  ('/minibar-sales/{minibarSale}/pay',     [MinibarSaleController::class, 'pay']);
    Route::post  ('/minibar-sales/{minibarSale}/cancel',  [MinibarSaleController::class, 'cancel']);
});
