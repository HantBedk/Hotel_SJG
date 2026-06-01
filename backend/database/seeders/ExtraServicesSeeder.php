<?php

namespace Database\Seeders;

use App\Models\ExtraService;
use Illuminate\Database\Seeder;

class ExtraServicesSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'Desayuno',         'price' => 15000, 'description' => 'Desayuno continental por persona'],
            ['name' => 'Almuerzo',          'price' => 20000, 'description' => 'Almuerzo por persona'],
            ['name' => 'Cena',              'price' => 20000, 'description' => 'Cena por persona'],
            ['name' => 'Lavandería',        'price' => 10000, 'description' => 'Servicio de lavandería por prenda'],
            ['name' => 'Parqueadero',       'price' => 8000,  'description' => 'Parqueadero por día'],
            ['name' => 'Minibar',           'price' => 5000,  'description' => 'Consumo de minibar'],
            ['name' => 'Transporte',        'price' => 30000, 'description' => 'Transporte aeropuerto/terminal'],
            ['name' => 'Servicio a cuarto', 'price' => 5000,  'description' => 'Cargo por servicio a la habitación'],
        ];

        foreach ($services as $service) {
            ExtraService::firstOrCreate(['name' => $service['name']], $service);
        }
    }
}
