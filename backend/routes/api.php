<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BackupController;
use App\Http\Controllers\Api\V1\SuggestionsController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExtraServiceController;
use App\Http\Controllers\Api\V1\GuestController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MinibarController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ReservationController;
use App\Http\Controllers\Api\V1\RoomController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\StayController;

/*
|--------------------------------------------------------------------------
| API Routes — Hotel Manager v1
|--------------------------------------------------------------------------
*/

// Broadcasting auth fuera del prefijo v1 (Laravel Echo usa /broadcasting/auth por defecto)
Route::middleware('auth:sanctum')->group(function () {
    Broadcast::routes();
});

Route::prefix('v1')->group(function () {

    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);

        Route::get('/ping', fn() => response()->json([
            'success' => true,
            'data'    => ['status' => 'ok', 'timestamp' => now()->toIso8601String()],
            'message' => 'Sistema activo.',
            'errors'  => [],
        ]));

        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update'])
             ->middleware('permission:manage_settings');

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])
             ->middleware('permission:view_dashboard');
        Route::get('/dashboard/occupancy-history', [DashboardController::class, 'occupancyHistory'])
             ->middleware('permission:view_dashboard');

        // Habitaciones
        Route::get('/room-types', [RoomController::class, 'types'])
             ->middleware('permission:view_rooms');
        Route::get('/rooms', [RoomController::class, 'index'])
             ->middleware('permission:view_rooms');
        Route::post('/rooms', [RoomController::class, 'store'])
             ->middleware('permission:manage_rooms');
        Route::get('/rooms/{room}', [RoomController::class, 'show'])
             ->middleware('permission:view_rooms');
        Route::put('/rooms/{room}', [RoomController::class, 'update'])
             ->middleware('permission:manage_rooms');
        Route::patch('/rooms/{room}/status', [RoomController::class, 'updateStatus'])
             ->middleware('permission:manage_rooms|check_in');
        Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])
             ->middleware('permission:manage_rooms');

        // Huéspedes
        Route::get('/guests',    [GuestController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/guests',   [GuestController::class, 'store'])
             ->middleware('permission:manage_reservations|check_in');
        Route::get('/guests/{guest}',    [GuestController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::put('/guests/{guest}',    [GuestController::class, 'update'])
             ->middleware('permission:manage_reservations|check_in');
        Route::delete('/guests/{guest}', [GuestController::class, 'destroy'])
             ->middleware('permission:manage_reservations');
        Route::get('/guests/{guest}/companions',         [GuestController::class, 'companions'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/guests/{guest}/companions',        [GuestController::class, 'storeCompanion'])
             ->middleware('permission:manage_reservations|check_in');
        Route::delete('/guests/{guest}/companions/{companion}', [GuestController::class, 'destroyCompanion'])
             ->middleware('permission:manage_reservations');
        Route::get('/guests/{guest}/stays', [GuestController::class, 'stays'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');

        // Empresas
        Route::get('/companies',    [CompanyController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/companies',   [CompanyController::class, 'store'])
             ->middleware('permission:manage_reservations|check_in');
        Route::get('/companies/{company}',    [CompanyController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::put('/companies/{company}',    [CompanyController::class, 'update'])
             ->middleware('permission:manage_reservations');
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])
             ->middleware('permission:manage_reservations');

        // Estadías (Check-in / Check-out)
        Route::get('/stays',    [StayController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::post('/stays',   [StayController::class, 'store'])
             ->middleware('permission:check_in');
        Route::get('/stays/{stay}',  [StayController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations|check_in');
        Route::patch('/stays/{stay}/checkout',  [StayController::class, 'checkout'])
             ->middleware('permission:check_out');
        Route::get('/stays/{stay}/account',     [StayController::class, 'account'])
             ->middleware('permission:check_out|check_in|manage_reservations');
        Route::get('/stays/{stay}/receipt',     [StayController::class, 'receipt'])
             ->middleware('permission:check_out|check_in|manage_reservations');
        Route::post('/stays/{stay}/extend',     [StayController::class, 'extend'])
             ->middleware('permission:check_out|check_in');
        Route::post('/stays/{stay}/add-room',   [StayController::class, 'addRoom'])
             ->middleware('permission:check_in');
        Route::post('/stays/{stay}/minibar',    [StayController::class, 'minibarCharges'])
             ->middleware('permission:check_out|check_in');
        Route::post('/stays/{stay}/transfer',   [StayController::class, 'transfer'])
             ->middleware('permission:check_in|check_out');
        Route::post('/stays/{stay}/payments',   [StayController::class, 'addPayment'])
             ->middleware('permission:check_in|check_out|manage_reservations');
        Route::post('/stays/{stay}/services',   [StayController::class, 'addService'])
             ->middleware('permission:check_in|check_out|manage_reservations');

        // Servicios extra (catálogo)
        Route::get('/extra-services', [ExtraServiceController::class, 'index'])
             ->middleware('permission:check_in|check_out|manage_reservations');

        // Reservas
        Route::get('/reservations', [ReservationController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations');
        Route::post('/reservations', [ReservationController::class, 'store'])
             ->middleware('permission:manage_reservations');
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show'])
             ->middleware('permission:view_reservations|manage_reservations');
        Route::put('/reservations/{reservation}', [ReservationController::class, 'update'])
             ->middleware('permission:manage_reservations');
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy'])
             ->middleware('permission:manage_reservations');
        Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])
             ->middleware('permission:manage_reservations');
        Route::patch('/reservations/{reservation}/extend', [ReservationController::class, 'extend'])
             ->middleware('permission:manage_reservations');
        Route::post('/reservations/{reservation}/check-in', [ReservationController::class, 'checkIn'])
             ->middleware('permission:check_in');
        Route::post('/reservations/{reservation}/payments', [ReservationController::class, 'addPayment'])
             ->middleware('permission:manage_reservations|check_in');

        // Calendario
        Route::get('/calendar', [CalendarController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|view_rooms');

        // ── Inventario ────────────────────────────────────────────────────────
        Route::prefix('inventory')->middleware('permission:view_inventory|manage_inventory')->group(function () {
            // Categorías
            Route::get('/categories',  [InventoryController::class, 'categories']);
            Route::post('/categories', [InventoryController::class, 'storeCategory'])
                 ->middleware('permission:manage_inventory');

            // Ítems
            Route::get('/items',    [InventoryController::class, 'index']);
            Route::post('/items',   [InventoryController::class, 'store'])
                 ->middleware('permission:manage_inventory');
            Route::get('/items/{inventoryItem}',    [InventoryController::class, 'show']);
            Route::put('/items/{inventoryItem}',    [InventoryController::class, 'update'])
                 ->middleware('permission:manage_inventory');
            Route::delete('/items/{inventoryItem}', [InventoryController::class, 'destroy'])
                 ->middleware('permission:manage_inventory');
            Route::post('/items/{inventoryItem}/restock', [InventoryController::class, 'restock'])
                 ->middleware('permission:manage_inventory');
            Route::post('/items/{inventoryItem}/adjust',  [InventoryController::class, 'adjust'])
                 ->middleware('permission:manage_inventory');
            Route::post('/items/{inventoryItem}/deliver', [InventoryController::class, 'deliver'])
                 ->middleware('permission:manage_inventory');
            Route::get('/items/{inventoryItem}/transactions', [InventoryController::class, 'transactions']);

            // Minibar — productos
            Route::get('/minibar/products',               [MinibarController::class, 'productsIndex']);
            Route::post('/minibar/products',              [MinibarController::class, 'productsStore'])
                 ->middleware('permission:manage_inventory');
            Route::put('/minibar/products/{minibarProduct}',    [MinibarController::class, 'productsUpdate'])
                 ->middleware('permission:manage_inventory');
            Route::delete('/minibar/products/{minibarProduct}', [MinibarController::class, 'productsDestroy'])
                 ->middleware('permission:manage_inventory');
            Route::get('/minibar/room-minibars', [MinibarController::class, 'roomMinibars']);
            Route::post('/minibar/restock-room', [MinibarController::class, 'restockRoom'])
                 ->middleware('permission:manage_inventory');

            // Activos
            Route::get('/assets',         [AssetController::class, 'index']);
            Route::post('/assets',        [AssetController::class, 'store'])
                 ->middleware('permission:manage_inventory');
            Route::put('/assets/{asset}',    [AssetController::class, 'update'])
                 ->middleware('permission:manage_inventory');
            Route::delete('/assets/{asset}', [AssetController::class, 'destroy'])
                 ->middleware('permission:manage_inventory');

            // Mantenimientos
            Route::get('/maintenances',                          [AssetController::class, 'maintenances']);
            Route::post('/assets/{asset}/maintenance',           [AssetController::class, 'addMaintenance'])
                 ->middleware('permission:manage_inventory');
            Route::patch('/maintenance/{maintenance}/complete',  [AssetController::class, 'completeMaintenance'])
                 ->middleware('permission:manage_inventory');

            // Órdenes de reparación
            Route::get('/repair-orders',                                [AssetController::class, 'repairOrders']);
            Route::post('/repair-orders',                               [AssetController::class, 'createRepairOrder']);
            Route::patch('/repair-orders/{repairOrder}/assign',         [AssetController::class, 'assignRepairOrder'])
                 ->middleware('permission:manage_inventory');
            Route::patch('/repair-orders/{repairOrder}/close',          [AssetController::class, 'closeRepairOrder'])
                 ->middleware('permission:manage_inventory');
        });

        // ── Notificaciones ────────────────────────────────────────────────────
        Route::get('/notifications',              [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);

        // ── Actividad / Historial ─────────────────────────────────────────────
        Route::middleware('permission:view_activity_log')->group(function () {
            Route::get('/activity-logs',         [ActivityLogController::class, 'index']);
            Route::get('/activity-logs/actions', [ActivityLogController::class, 'actions']);
            Route::get('/reports/payments',      [ActivityLogController::class, 'payments']);
        });

        // ── Sugerencias ───────────────────────────────────────────────────────
        Route::middleware('permission:view_dashboard')->group(function () {
            Route::get('/suggestions',                        [SuggestionsController::class, 'index']);
            Route::post('/suggestions/{suggestion}/dismiss',  [SuggestionsController::class, 'dismiss']);
        });

        // ── Admin ─────────────────────────────────────────────────────────────
        Route::prefix('admin')->middleware('permission:manage_settings')->group(function () {

            // Hotel
            Route::get('/hotel',       [AdminController::class, 'getHotelInfo']);
            Route::put('/hotel',       [AdminController::class, 'updateHotelInfo']);
            Route::post('/hotel/logo', [AdminController::class, 'uploadLogo']);

            // Tipos de habitación
            Route::get('/room-types',             [AdminController::class, 'getRoomTypes']);
            Route::post('/room-types',            [AdminController::class, 'storeRoomType']);
            Route::put('/room-types/{roomType}',  [AdminController::class, 'updateRoomType']);
            Route::delete('/room-types/{roomType}', [AdminController::class, 'destroyRoomType']);

            // Casas
            Route::get('/houses',          [AdminController::class, 'getHouses']);
            Route::post('/houses',         [AdminController::class, 'storeHouse']);
            Route::put('/houses/{house}',  [AdminController::class, 'updateHouse']);
            Route::delete('/houses/{house}', [AdminController::class, 'destroyHouse']);

            // Habitaciones (vista admin)
            Route::get('/rooms',               [AdminController::class, 'getAllRooms']);
            Route::post('/rooms',              [AdminController::class, 'storeRoom']);
            Route::put('/rooms/{room}',        [AdminController::class, 'updateRoom']);
            Route::delete('/rooms/{room}',     [AdminController::class, 'destroyRoom']);
            Route::patch('/rooms/mass-update', [AdminController::class, 'massUpdateRoomPrices']);

            // Temporadas
            Route::get('/seasons',             [AdminController::class, 'getSeasons']);
            Route::post('/seasons',            [AdminController::class, 'storeSeason']);
            Route::put('/seasons/{season}',    [AdminController::class, 'updateSeason']);
            Route::delete('/seasons/{season}', [AdminController::class, 'destroySeason']);

            // Servicios extra
            Route::get('/extra-services',                    [AdminController::class, 'getExtraServices']);
            Route::post('/extra-services',                   [AdminController::class, 'storeExtraService']);
            Route::put('/extra-services/{extraService}',     [AdminController::class, 'updateExtraService']);
            Route::delete('/extra-services/{extraService}',  [AdminController::class, 'destroyExtraService']);

            // Usuarios
            Route::get('/users',           [AdminController::class, 'getUsers'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_users|manage_settings');
            Route::post('/users',          [AdminController::class, 'storeUser'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_users');
            Route::put('/users/{user}',    [AdminController::class, 'updateUser'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_users');
            Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_users');

            // Roles y permisos
            Route::get('/roles',                          [AdminController::class, 'getRoles'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_roles|manage_users');
            Route::get('/permissions',                    [AdminController::class, 'getPermissions'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_roles');
            Route::put('/roles/{role}/permissions',       [AdminController::class, 'updateRolePermissions'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:manage_roles');

            // Backups
            Route::get('/backups',                            [BackupController::class, 'index'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup|restore_backup');
            Route::post('/backups',                           [BackupController::class, 'create'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');
            Route::get('/backups/{filename}/download',        [BackupController::class, 'download'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup|restore_backup');
            Route::post('/backups/restore',                   [BackupController::class, 'restore'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:restore_backup');
        });
    });
});
