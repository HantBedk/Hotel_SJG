<?php

use App\Http\Controllers\Api\V1\IncomeController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:view_reports')->group(function () {
    Route::get('/income/summary', [IncomeController::class, 'summary']);
    Route::get('/income/daily',   [IncomeController::class, 'daily']);
    Route::get('/income/report',  [IncomeController::class, 'report']);
});
