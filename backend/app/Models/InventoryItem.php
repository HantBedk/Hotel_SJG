<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'category_id', 'code', 'name', 'brand', 'presentation', 'unit',
        'cost_price', 'sale_price',
        'expiry_date', 'supplier', 'invoice_number', 'active',
    ];

    protected function casts(): array
    {
        return [
            'cost_price'    => 'decimal:2',
            'sale_price'    => 'decimal:2',
            'expiry_date'   => 'date',
            'active'        => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function hotelInventories(): HasMany
    {
        return $this->hasMany(HotelInventory::class);
    }

    public function isLowStock(int $currentStock, int $minThreshold): bool
    {
        return $currentStock <= $minThreshold;
    }

    public function isExpiringSoon(int $days = 3): bool
    {
        return $this->expiry_date !== null && $this->expiry_date->lte(now()->addDays($days));
    }
}
