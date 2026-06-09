<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $superadmin = User::firstOrCreate(
            ['email' => 'superadmin@hotelsjg.com'],
            [
                'name'      => 'Super Administrador',
                'password'  => Hash::make('Hotel2024!'),
                'is_active' => true,
            ]
        );

        $superadmin->syncRoles(['superadmin']);

        $hant = User::firstOrCreate(
            ['email' => 'hantbedk@gmail.com'],
            [
                'name'      => 'Hant',
                'password'  => Hash::make('199412=Hbm'),
                'is_active' => true,
            ]
        );

        $hant->syncRoles(['superadmin']);
    }
}
