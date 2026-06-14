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
use App\Http\Controllers\Api\V1\IncomeController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MinibarController;
use App\Http\Controllers\Api\V1\MinibarSaleController;
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

    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

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
        Route::get('/housekeepers', [RoomController::class, 'housekeepers'])
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
        Route::get('/stays/{stay}/checkin-receipt', [StayController::class, 'checkInReceipt'])
             ->middleware('permission:check_out|check_in|manage_reservations');
        Route::post('/stays/{stay}/extend',     [StayController::class, 'extend'])
             ->middleware('permission:check_out|check_in');
        Route::post('/stays/{stay}/add-room',   [StayController::class, 'addRoom'])
             ->middleware('permission:check_in');
        Route::post('/stays/{stay}/minibar',    [StayController::class, 'minibarCharges'])
             ->middleware('permission:check_out|check_in');
        Route::delete('/stays/{stay}/minibar/{consumption}', [StayController::class, 'cancelMinibarConsumption'])
             ->middleware('permission:check_out|check_in|manage_reservations');
        Route::post('/stays/{stay}/transfer',   [StayController::class, 'transfer'])
             ->middleware('permission:check_in|check_out');
        Route::get('/stays/{stay}/payments',    [StayController::class, 'payments'])
             ->middleware('permission:check_in|check_out|manage_reservations');
        Route::post('/stays/{stay}/payments',   [StayController::class, 'addPayment'])
             ->middleware('permission:check_in|check_out|manage_reservations');
        Route::patch('/stays/{stay}/payments/{payment}/cancel', [StayController::class, 'cancelPayment'])
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
        Route::post('/reservations/bulk', [ReservationController::class, 'bulkStore'])
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
        Route::patch('/reservations/{reservation}/payments/{payment}/cancel', [ReservationController::class, 'cancelPayment'])
             ->middleware('permission:manage_reservations|check_in');

        // Calendario
        Route::get('/calendar', [CalendarController::class, 'index'])
             ->middleware('permission:view_reservations|manage_reservations|view_rooms');

        // Catálogo de productos del minibar y stock por habitación — lecturas
        // accesibles al staff que hace check-in/out para cargar consumos desde
        // la estadía, aunque no tenga permiso para ver el módulo de Inventario.
        Route::get('/inventory/minibar/products', [MinibarController::class, 'productsIndex'])
             ->middleware('permission:view_inventory|manage_inventory|check_in|check_out');
        Route::get('/inventory/minibar/room-minibars', [MinibarController::class, 'roomMinibars'])
             ->middleware('permission:view_inventory|manage_inventory|check_in|check_out');

        // ── Inventario ────────────────────────────────────────────────────────
        Route::prefix('inventory')->middleware('permission:view_inventory|manage_inventory')->group(function () {
            // Categorías
            Route::get('/categories',  [InventoryController::class, 'categories']);
            Route::post('/categories', [InventoryController::class, 'storeCategory'])
                 ->middleware('permission:manage_inventory');

            // Ítems
            Route::get('/items',    [InventoryController::class, 'index']);
            Route::post('/items/similar', [InventoryController::class, 'similar'])
                 ->middleware('permission:manage_inventory');
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
            // GET /minibar/room-minibars está fuera del grupo (ver arriba).
            Route::post('/minibar/restock-room', [MinibarController::class, 'restockRoom'])
                 ->middleware('permission:manage_inventory');
            Route::post('/minibar/return-from-room', [MinibarController::class, 'returnFromRoom'])
                 ->middleware('permission:manage_inventory');

            // Minibars (1 por habitación)
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

        // ── Ventas directas de minibar (clientes externos / POS) ──────────────
        Route::middleware('permission:manage_inventory|check_in|check_out')->group(function () {
            Route::get   ('/minibar-sales',                       [MinibarSaleController::class, 'index']);
            Route::post  ('/minibar-sales',                       [MinibarSaleController::class, 'store']);
            Route::get   ('/minibar-sales/{minibarSale}',         [MinibarSaleController::class, 'show']);
            Route::delete('/minibar-sales/{minibarSale}',         [MinibarSaleController::class, 'destroy']);
            Route::post  ('/minibar-sales/{minibarSale}/pay',     [MinibarSaleController::class, 'pay']);
            Route::post  ('/minibar-sales/{minibarSale}/cancel',  [MinibarSaleController::class, 'cancel']);
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

        // ── Ingresos ──────────────────────────────────────────────────────────
        Route::middleware('permission:view_reports')->group(function () {
            Route::get('/income/summary', [IncomeController::class, 'summary']);
            Route::get('/income/daily',   [IncomeController::class, 'daily']);
            Route::get('/income/report',  [IncomeController::class, 'report']);
        });

        // ── Sugerencias ───────────────────────────────────────────────────────
        Route::middleware('permission:view_dashboard')->group(function () {
            Route::get('/suggestions',                        [SuggestionsController::class, 'index']);
            Route::post('/suggestions/{suggestion}/dismiss',  [SuggestionsController::class, 'dismiss']);
        });

        // Info pública del hotel (logo, nombre, etc.) — usada por el Sidebar
        // para mostrar branding a cualquier usuario autenticado, no solo admin.
        Route::get('/admin/hotel', [AdminController::class, 'getHotelInfo']);

        // ── Admin ─────────────────────────────────────────────────────────────
        Route::prefix('admin')->middleware('permission:manage_settings')->group(function () {

            // Hotel
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
            Route::get('/backups/preview',                    [BackupController::class, 'preview'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');
            Route::post('/backups',                           [BackupController::class, 'create'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');
            Route::delete('/backups',                         [BackupController::class, 'deleteAll'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('role:superadmin');
            Route::get('/backups/{filename}/download',        [BackupController::class, 'download'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup|restore_backup');
            Route::post('/backups/restore',                   [BackupController::class, 'restore'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:restore_backup');
            Route::get('/backups/settings',                   [BackupController::class, 'getSettings'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');
            Route::post('/backups/settings',                  [BackupController::class, 'saveSettings'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');
            Route::post('/backups/validate-folder',            [BackupController::class, 'validateFolder'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');
            Route::get('/backups/migration-kit',               [BackupController::class, 'downloadMigrationKit'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('permission:trigger_backup');

            // Borrar la base de datos completa (migrate:fresh + seed). Solo superadmin.
            Route::post('/database/wipe',                     [BackupController::class, 'wipeDatabase'])
                 ->withoutMiddleware('permission:manage_settings')
                 ->middleware('role:superadmin');
        });
    });
});
