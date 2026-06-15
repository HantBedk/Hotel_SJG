<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelInventory extends Model
{
    use HasUuids;

    protected $table = 'hotel_inventory';

    protected $fillable = [
        'hotel_id',
        'inventory_item_id',
        'current_stock',
        'min_stock_threshold',
        'location',
    ];

    protected function casts(): array
    {
        return [
            'current_stock'       => 'integer',
            'min_stock_threshold' => 'integer',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock_threshold;
    }
}
