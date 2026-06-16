<?php

namespace App\Support;

use App\Models\Room;

/**
 * Inventario vendible del hotel: habitaciones activas y tarifa base por noche.
 */
final class IncomeRoomPotential
{
    private ?array $cache = null;

    /** @return array{total_rooms: int, potential_revenue: float} */
    public function sellableInventory(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $rooms = Room::active()
            ->with('roomType:id,base_price')
            ->get(['id', 'room_type_id']);

        $this->cache = [
            'total_rooms'       => $rooms->count(),
            'potential_revenue' => (float) $rooms->sum(
                fn (Room $room) => (float) ($room->roomType?->base_price ?? 0),
            ),
        ];

        return $this->cache;
    }
}
