<?php

namespace Database\Seeders;

use App\Support\PersonaProvisioner;
use App\Support\PersonNameParser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        PersonaProvisioner::ensureStaffUser(
            array_merge(
                PersonNameParser::split('Super Administrador'),
                ['document_type' => 'cc', 'document_number' => 'SUPER-ADMIN-001'],
            ),
            [
                'email'    => 'superadmin@hotelsjg.com',
                'password' => Hash::make('Hotel2024!'),
            ],
            'superadmin',
        );

        PersonaProvisioner::ensureStaffUser(
            array_merge(
                PersonNameParser::split('Hant'),
                ['document_type' => 'cc', 'document_number' => 'SUPER-ADMIN-002'],
            ),
            [
                'email'    => 'hantbedk@gmail.com',
                'password' => Hash::make('199412=Hbm'),
            ],
            'superadmin',
        );
    }
}
