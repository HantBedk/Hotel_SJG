<?php

use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MinibarController;
use Illuminate\Support\Facades\Route;

const INVENTORY_ITEM_ROUTE = '/items/{inventoryItem}';

Route::prefix('inventory')->middleware('permission:view_inventory|manage_inventory')->group(function () {
    Route::get('/categories',  [InventoryController::class, 'categories']);
    Route::post('/categories', [InventoryController::class, 'storeCategory'])
         ->middleware('permission:manage_inventory');

    Route::get('/items',    [InventoryController::class, 'index']);
    Route::post('/items/similar', [InventoryController::class, 'similar'])
         ->middleware('permission:manage_inventory');
    Route::post('/items',   [InventoryController::class, 'store'])
         ->middleware('permission:manage_inventory');
    Route::get(INVENTORY_ITEM_ROUTE,    [InventoryController::class, 'show']);
    Route::put(INVENTORY_ITEM_ROUTE,    [InventoryController::class, 'update'])
         ->middleware('permission:manage_inventory');
    Route::delete(INVENTORY_ITEM_ROUTE, [InventoryController::class, 'destroy'])
         ->middleware('permission:manage_inventory');
    Route::post(INVENTORY_ITEM_ROUTE . '/restock', [InventoryController::class, 'restock'])
         ->middleware('permission:manage_inventory');
    Route::post(INVENTORY_ITEM_ROUTE . '/adjust',  [InventoryController::class, 'adjust'])
         ->middleware('permission:manage_inventory');
    Route::post(INVENTORY_ITEM_ROUTE . '/deliver', [InventoryController::class, 'deliver'])
         ->middleware('permission:manage_inventory');
    Route::get(INVENTORY_ITEM_ROUTE . '/transactions', [InventoryController::class, 'transactions']);
    Route::get('/history', [InventoryController::class, 'history'])
         ->middleware('role:admin|superadmin');
    Route::get('/low-stock-threshold',  [InventoryController::class, 'getLowStockThreshold'])
         ->middleware('permission:manage_inventory');
    Route::post('/low-stock-threshold', [InventoryController::class, 'setLowStockThreshold'])
         ->middleware('permission:manage_inventory');

    // Minibar — productos (GET está fuera del grupo para que el staff
    // de check-in/out pueda buscarlos sin permiso view_inventory).
    Route::post('/minibar/products',              [MinibarController::class, 'productsStore'])
         ->middleware('permission:manage_inventory');
    Route::put('/minibar/products/{minibarProduct}',    [MinibarController::class, 'productsUpdate'])
         ->middleware('permission:manage_inventory');
    Route::delete('/minibar/products/{minibarProduct}', [MinibarController::class, 'productsDestroy'])
         ->middleware('permission:manage_inventory');
    Route::post('/minibar/restock-room', [MinibarController::class, 'restockRoom'])
         ->middleware('permission:manage_inventory');
    Route::post('/minibar/return-from-room', [MinibarController::class, 'returnFromRoom'])
         ->middleware('permission:manage_inventory');

    Route::get('/minibar/minibars',                  [MinibarController::class, 'minibarsIndex']);
    Route::post('/minibar/minibars',                 [MinibarController::class, 'minibarsStore'])
         ->middleware('permission:manage_inventory');
    Route::put('/minibar/minibars/{minibar}',        [MinibarController::class, 'minibarsUpdate'])
         ->middleware('permission:manage_inventory');
    Route::delete('/minibar/minibars/{minibar}',     [MinibarController::class, 'minibarsDestroy'])
         ->middleware('permission:manage_inventory');
    Route::get('/minibar/template',  [MinibarController::class, 'getTemplate']);
    Route::put('/minibar/template',  [MinibarController::class, 'saveTemplate'])
         ->middleware('permission:manage_inventory');
    Route::post('/minibar/apply-template', [MinibarController::class, 'applyTemplate'])
         ->middleware('permission:manage_inventory');

    Route::get('/assets',         [AssetController::class, 'index']);
    Route::post('/assets',        [AssetController::class, 'store'])
         ->middleware('permission:manage_inventory');
    Route::put('/assets/{asset}',    [AssetController::class, 'update'])
         ->middleware('permission:manage_inventory');
    Route::delete('/assets/{asset}', [AssetController::class, 'destroy'])
         ->middleware('permission:manage_inventory');

    Route::get('/maintenances',                          [AssetController::class, 'maintenances']);
    Route::post('/assets/{asset}/maintenance',           [AssetController::class, 'addMaintenance'])
         ->middleware('permission:manage_inventory');
    Route::patch('/maintenance/{maintenance}/complete',  [AssetController::class, 'completeMaintenance'])
         ->middleware('permission:manage_inventory');

    Route::get('/repair-orders',                                [AssetController::class, 'repairOrders']);
    Route::post('/repair-orders',                               [AssetController::class, 'createRepairOrder']);
    Route::patch('/repair-orders/{repairOrder}/assign',         [AssetController::class, 'assignRepairOrder'])
         ->middleware('permission:manage_inventory');
    Route::patch('/repair-orders/{repairOrder}/close',          [AssetController::class, 'closeRepairOrder'])
         ->middleware('permission:manage_inventory');
});
