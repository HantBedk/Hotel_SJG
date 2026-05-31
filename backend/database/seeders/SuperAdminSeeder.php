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

        $admin = User::firstOrCreate(
            ['email' => 'admin@hotelsjg.com'],
            [
                'name'      => 'Administrador',
                'password'  => Hash::make('Hotel2024!'),
                'is_active' => true,
            ]
        );

        $admin->syncRoles(['admin']);

        $receptionist = User::firstOrCreate(
            ['email' => 'recepcion@hotelsjg.com'],
            [
                'name'      => 'Recepcionista',
                'password'  => Hash::make('Hotel2024!'),
                'is_active' => true,
            ]
        );

        $receptionist->syncRoles(['receptionist']);
    }
}
