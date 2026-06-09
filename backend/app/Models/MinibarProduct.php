<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MinibarProduct extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'name', 'presentation', 'inventory_item_id',
        'sale_price', 'cost_price', 'damage_price',
        'stock_quantity', 'expiration_date',
        'description', 'active',
    ];

    protected function casts(): array
    {
        return [
            'sale_price'      => 'decimal:2',
            'cost_price'      => 'decimal:2',
            'damage_price'    => 'decimal:2',
            'stock_quantity'  => 'integer',
            'expiration_date' => 'date',
            'active'          => 'boolean',
        ];
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function roomMinibars(): HasMany
    {
        return $this->hasMany(RoomMinibar::class);
    }
}
