<?php

use App\Http\Controllers\Api\V1\SuggestionsController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:view_dashboard')->group(function () {
    Route::get('/suggestions',                        [SuggestionsController::class, 'index']);
    Route::post('/suggestions/{suggestion}/dismiss',  [SuggestionsController::class, 'dismiss']);
});
