<?php

namespace App\Support;

use App\Models\RoomFeature;

class RoomFeatureDefaults
{
    /** @var list<string> */
    private const NAMES = [
        'Aire acondicionado',
        'TV',
        'Teléfono fijo',
        'Internet / WiFi',
        'Baño privado',
        'Minibar',
        'Balcón',
        'Caja fuerte',
    ];

    public static function seedForHotel(string $hotelId): void
    {
        foreach (self::NAMES as $index => $name) {
            RoomFeature::withoutGlobalScopes()->firstOrCreate(
                ['hotel_id' => $hotelId, 'name' => $name],
                ['sort_order' => $index * 10, 'is_active' => true],
            );
        }
    }
}
