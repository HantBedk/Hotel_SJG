<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Solo estructura base + 2 superadmins. Sin habitaciones, tipos,
        // servicios ni categorías de ejemplo — el cliente los configura después.
        $this->call([
            HotelSeeder::class,
            NationalitiesSeeder::class,
            RolesPermissionsSeeder::class,
            SuperAdminSeeder::class,
            SettingsSeeder::class,
        ]);
    }
}
