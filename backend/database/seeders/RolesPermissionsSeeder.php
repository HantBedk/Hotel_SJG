<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesPermissionsSeeder extends Seeder
{
    private const PERMISSIONS = [
        'view_dashboard',
        'view_rooms',
        'manage_rooms',
        'view_reservations',
        'manage_reservations',
        'check_in',
        'check_out',
        'view_inventory',
        'manage_inventory',
        'view_settings',
        'manage_settings',
        'view_activity_log',
        'manage_users',
        'manage_roles',
        'trigger_backup',
        'restore_backup',
        'view_reports',
    ];

    private const ROLES = [
        // superadmin gets all via Gate::before in AppServiceProvider
        'superadmin'   => [],
        // admin: todos excepto manage_roles
        'admin'        => [
            'view_dashboard',
            'view_rooms', 'manage_rooms',
            'view_reservations', 'manage_reservations',
            'check_in', 'check_out',
            'view_inventory', 'manage_inventory',
            'view_settings', 'manage_settings',
            'view_activity_log',
            'manage_users',
            'trigger_backup', 'restore_backup',
            'view_reports',
        ],
        'receptionist' => [
            'view_dashboard',
            'view_rooms',
            'manage_reservations',
            'check_in', 'check_out',
            'view_inventory',
        ],
        'housekeeping' => [],
        'maintenance'  => [],
    ];

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'sanctum']);
        }

        foreach (self::ROLES as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);

            if (!empty($permissions)) {
                $role->syncPermissions($permissions);
            }
        }
    }
}
