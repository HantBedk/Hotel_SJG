<?php

namespace App\Support;

use App\Models\HotelInventory;
use App\Models\InventoryItem;
use Illuminate\Support\Str;

class HotelInventoryService
{
    public static function forItem(InventoryItem $item, ?string $hotelId = null): HotelInventory
    {
        $hotelId ??= TenantContext::requireId();

        return HotelInventory::firstOrCreate(
            ['hotel_id' => $hotelId, 'inventory_item_id' => $item->id],
            ['id' => (string) Str::uuid(), 'current_stock' => 0, 'min_stock_threshold' => 5]
        );
    }

    public static function attachStockData(InventoryItem $item, ?string $hotelId = null): InventoryItem
    {
        $inv = self::forItem($item, $hotelId);
        $item->setAttribute('current_stock', $inv->current_stock);
        $item->setAttribute('min_stock_threshold', $inv->min_stock_threshold);
        $item->setAttribute('location', $inv->location);

        return $item;
    }
}
