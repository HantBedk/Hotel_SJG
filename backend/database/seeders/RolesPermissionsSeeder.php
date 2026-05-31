<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesPermissionsSeeder extends Seeder
{
    private const PERMISSIONS = [
        // Habitaciones
        'view_rooms',
        'manage_rooms',
        // Estadías
        'view_stays',
        'create_stays',
        'manage_stays',
        'transfer_guest',
        // Huéspedes
        'view_guests',
        'manage_guests',
        // Reservaciones
        'view_reservations',
        'manage_reservations',
        // Pagos
        'view_payments',
        'manage_payments',
        // Reportes
        'view_reports',
        // Configuración
        'manage_settings',
        // Usuarios
        'manage_users',
        // Historial / Auditoría
        'view_audit',
    ];

    private const ROLES = [
        'superadmin'   => [], // hereda todo vía Gate::before
        'admin'        => [
            'view_rooms', 'manage_rooms',
            'view_stays', 'create_stays', 'manage_stays', 'transfer_guest',
            'view_guests', 'manage_guests',
            'view_reservations', 'manage_reservations',
            'view_payments', 'manage_payments',
            'view_reports',
            'manage_settings',
            'manage_users',
            'view_audit',
        ],
        'receptionist' => [
            'view_rooms',
            'view_stays', 'create_stays', 'manage_stays', 'transfer_guest',
            'view_guests', 'manage_guests',
            'view_reservations', 'manage_reservations',
            'view_payments', 'manage_payments',
        ],
        'housekeeping' => [
            'view_rooms',
        ],
        'maintenance'  => [
            'view_rooms',
        ],
    ];

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'sanctum']);
        }

        foreach (self::ROLES as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);

            if (! empty($permissions)) {
                $role->syncPermissions($permissions);
            }
        }
    }
}
