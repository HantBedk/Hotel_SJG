<?php

namespace Database\Seeders;

use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomTypesSeeder extends Seeder
{
    private const AMENITY_PRIVATE_BATH = 'baño_privado';

    public function run(): void
    {
        $types = [
            [
                'name'          => 'Sencilla',
                'description'   => 'Habitación con una cama individual',
                'base_price'    => 80000,
                'max_occupancy' => 1,
                'amenities'     => ['wifi', 'tv', self::AMENITY_PRIVATE_BATH],
            ],
            [
                'name'          => 'Doble',
                'description'   => 'Habitación con dos camas individuales',
                'base_price'    => 120000,
                'max_occupancy' => 2,
                'amenities'     => ['wifi', 'tv', self::AMENITY_PRIVATE_BATH, 'aire_acondicionado'],
            ],
            [
                'name'          => 'Matrimonial',
                'description'   => 'Habitación con cama doble',
                'base_price'    => 130000,
                'max_occupancy' => 2,
                'amenities'     => ['wifi', 'tv', self::AMENITY_PRIVATE_BATH, 'aire_acondicionado'],
            ],
            [
                'name'          => 'Triple',
                'description'   => 'Habitación con tres camas',
                'base_price'    => 160000,
                'max_occupancy' => 3,
                'amenities'     => ['wifi', 'tv', self::AMENITY_PRIVATE_BATH, 'aire_acondicionado'],
            ],
            [
                'name'          => 'Suite',
                'description'   => 'Suite ejecutiva con sala de estar',
                'base_price'    => 220000,
                'max_occupancy' => 2,
                'amenities'     => ['wifi', 'tv', self::AMENITY_PRIVATE_BATH, 'aire_acondicionado', 'minibar', 'sala'],
            ],
            [
                'name'          => 'Casa',
                'description'   => 'Casa independiente con múltiples habitaciones',
                'base_price'    => 350000,
                'max_occupancy' => 8,
                'amenities'     => ['wifi', 'tv', 'cocina', 'sala', 'patio', 'parqueadero'],
            ],
        ];

        foreach ($types as $type) {
            RoomType::firstOrCreate(
                ['name' => $type['name']],
                array_diff_key($type, ['name' => ''])
            );
        }
    }
}
