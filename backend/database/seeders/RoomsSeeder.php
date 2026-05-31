<?php

namespace Database\Seeders;

use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomsSeeder extends Seeder
{
    public function run(): void
    {
        $hotel = Hotel::firstOrFail();

        $types = RoomType::pluck('id', 'name');

        $rooms = [
            // Piso 1
            ['number' => '101', 'floor' => 1, 'type' => 'Sencilla'],
            ['number' => '102', 'floor' => 1, 'type' => 'Sencilla'],
            ['number' => '103', 'floor' => 1, 'type' => 'Doble'],
            ['number' => '104', 'floor' => 1, 'type' => 'Doble'],
            ['number' => '105', 'floor' => 1, 'type' => 'Matrimonial'],
            ['number' => '106', 'floor' => 1, 'type' => 'Triple'],
            ['number' => '107', 'floor' => 1, 'type' => 'Triple'],
            // Piso 2
            ['number' => '201', 'floor' => 2, 'type' => 'Sencilla'],
            ['number' => '202', 'floor' => 2, 'type' => 'Sencilla'],
            ['number' => '203', 'floor' => 2, 'type' => 'Doble'],
            ['number' => '204', 'floor' => 2, 'type' => 'Matrimonial'],
            ['number' => '205', 'floor' => 2, 'type' => 'Triple'],
            ['number' => '206', 'floor' => 2, 'type' => 'Suite'],
            // Casa
            ['number' => 'Casa', 'floor' => null, 'type' => 'Casa'],
        ];

        foreach ($rooms as $r) {
            Room::firstOrCreate(
                ['hotel_id' => $hotel->id, 'number' => $r['number']],
                [
                    'room_type_id' => $types[$r['type']],
                    'floor'        => $r['floor'],
                    'status'       => 'available',
                    'is_active'    => true,
                ]
            );
        }
    }
}
