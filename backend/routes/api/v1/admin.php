<?php

use App\Http\Controllers\Api\V1\Admin\AdminCatalogController;
use App\Http\Controllers\Api\V1\Admin\AdminHotelController;
use App\Http\Controllers\Api\V1\Admin\AdminPropertyController;
use App\Http\Controllers\Api\V1\Admin\AdminRoleController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\BackupController;
use Illuminate\Support\Facades\Route;

const ADMIN_BACKUPS_ROUTE = '/backups';

Route::prefix('admin')->middleware('permission:manage_settings')->group(function () {
     Route::post('/hotels', [AdminHotelController::class, 'storeHotel'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_hotels');
     Route::put('/hotels/{hotel}', [AdminHotelController::class, 'updateHotel'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:view_hotels');
     Route::delete('/hotels/{hotel}', [AdminHotelController::class, 'destroyHotel'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_hotels');

     Route::put('/hotel',       [AdminHotelController::class, 'updateHotelInfo']);
     Route::post('/hotel/logo', [AdminHotelController::class, 'uploadLogo']);

     Route::get('/room-types',             [AdminPropertyController::class, 'getRoomTypes']);
     Route::post('/room-types',            [AdminPropertyController::class, 'storeRoomType']);
     Route::put('/room-types/{roomType}',  [AdminPropertyController::class, 'updateRoomType']);
     Route::delete('/room-types/{roomType}', [AdminPropertyController::class, 'destroyRoomType']);

     Route::get('/houses',          [AdminPropertyController::class, 'getHouses']);
     Route::post('/houses',         [AdminPropertyController::class, 'storeHouse']);
     Route::put('/houses/{house}',  [AdminPropertyController::class, 'updateHouse']);
     Route::delete('/houses/{house}', [AdminPropertyController::class, 'destroyHouse']);

     Route::get('/rooms',               [AdminPropertyController::class, 'getAllRooms']);
     Route::post('/rooms',              [AdminPropertyController::class, 'storeRoom']);
     Route::put('/rooms/{room}',        [AdminPropertyController::class, 'updateRoom']);
     Route::delete('/rooms/{room}',     [AdminPropertyController::class, 'destroyRoom']);
     Route::patch('/rooms/mass-update', [AdminPropertyController::class, 'massUpdateRoomPrices']);

     Route::get('/seasons',             [AdminCatalogController::class, 'getSeasons']);
     Route::post('/seasons',            [AdminCatalogController::class, 'storeSeason']);
     Route::put('/seasons/{season}',    [AdminCatalogController::class, 'updateSeason']);
     Route::delete('/seasons/{season}', [AdminCatalogController::class, 'destroySeason']);

     Route::get('/extra-services',                    [AdminCatalogController::class, 'getExtraServices']);
     Route::post('/extra-services',                   [AdminCatalogController::class, 'storeExtraService']);
     Route::put('/extra-services/{extraService}',     [AdminCatalogController::class, 'updateExtraService']);
     Route::delete('/extra-services/{extraService}',  [AdminCatalogController::class, 'destroyExtraService']);

     Route::get('/users',           [AdminUserController::class, 'getUsers'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_users|manage_settings');
     Route::post('/users',          [AdminUserController::class, 'storeUser'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_users');
     Route::put('/users/{user}',    [AdminUserController::class, 'updateUser'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_users');
     Route::delete('/users/{user}', [AdminUserController::class, 'destroyUser'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_users');

     Route::get('/roles',                          [AdminRoleController::class, 'getRoles'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_roles|manage_users');
     Route::get('/permissions',                    [AdminRoleController::class, 'getPermissions'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_roles');
     Route::put('/roles/{role}/permissions',       [AdminRoleController::class, 'updateRolePermissions'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:manage_roles');

     Route::get(ADMIN_BACKUPS_ROUTE,                            [BackupController::class, 'index'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:trigger_backup|restore_backup');
     Route::get('/backups/preview',                    [BackupController::class, 'preview'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:trigger_backup');
     Route::post(ADMIN_BACKUPS_ROUTE,                           [BackupController::class, 'create'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('permission:trigger_backup');
     Route::delete(ADMIN_BACKUPS_ROUTE,                         [BackupController::class, 'deleteAll'])
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

     Route::post('/database/wipe',                     [BackupController::class, 'wipeDatabase'])
          ->withoutMiddleware('permission:manage_settings')
          ->middleware('role:superadmin');
});
