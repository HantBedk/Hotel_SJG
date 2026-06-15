<?php

namespace Database\Seeders;

use App\Models\Hotel;
use App\Support\PersonaProvisioner;
use App\Support\PersonNameParser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MultitenantDemoSeeder extends Seeder
{
    public function run(): void
    {
        $hotelA = Hotel::firstOrCreate(
            ['nit' => '900000000-0'],
            [
                'name'              => 'Hotel San José del Guaviare',
                'address'           => 'Carrera 1 # 1-01',
                'phone'             => '+57 300 000 0000',
                'email'             => 'hotel@sjg.com',
                'city'              => 'San José del Guaviare',
                'country'           => 'CO',
                'check_in_time'     => '14:00:00',
                'check_out_time'    => '12:00:00',
                'late_checkout_fee' => 50000,
                'currency'          => 'COP',
                'tax_rate'          => 0.19,
            ]
        );

        $hotelB = Hotel::firstOrCreate(
            ['nit' => '900000001-7'],
            [
                'name'              => 'Hotel Demo Norte',
                'address'           => 'Calle 10 # 20-30',
                'phone'             => '+57 310 111 2233',
                'email'             => 'norte@demo.hotel',
                'city'              => 'Villavicencio',
                'country'           => 'CO',
                'check_in_time'     => '15:00:00',
                'check_out_time'    => '12:00:00',
                'late_checkout_fee' => 40000,
                'currency'          => 'COP',
                'tax_rate'          => 0.19,
            ]
        );

        $admin = PersonaProvisioner::ensureStaffUser(
            array_merge(
                PersonNameParser::split('Admin Demo'),
                ['document_type' => 'cc', 'document_number' => 'DEMO-ADMIN-001'],
            ),
            [
                'email'    => 'admin@demo.hotel',
                'password' => Hash::make('Demo2024!'),
            ],
            'admin',
        );
        $admin->hotels()->sync([$hotelA->id, $hotelB->id]);

        $receptionist = PersonaProvisioner::ensureStaffUser(
            array_merge(
                PersonNameParser::split('Recepcionista Demo'),
                ['document_type' => 'cc', 'document_number' => 'DEMO-RECEP-001'],
            ),
            [
                'email'    => 'recepcion@demo.hotel',
                'password' => Hash::make('Demo2024!'),
            ],
            'receptionist',
        );
        $receptionist->hotels()->sync([$hotelA->id]);
    }
}
