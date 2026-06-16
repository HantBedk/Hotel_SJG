<?php

namespace Database\Seeders;

use App\Models\Hotel;
use Illuminate\Database\Seeder;

class HotelSeeder extends Seeder
{
    public function run(): void
    {
        Hotel::updateOrCreate(
            ['nit' => '900000000-0'],
            [
                'name'              => 'Hotel de Prueba',
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
    }
}
