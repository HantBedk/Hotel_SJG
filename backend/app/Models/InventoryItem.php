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
        'cost_price', 'sale_price', 'current_stock', 'min_stock_threshold',
        'expiry_date', 'supplier', 'invoice_number', 'location', 'active',
    ];

    protected function casts(): array
    {
        return [
            'cost_price'          => 'decimal:2',
            'sale_price'          => 'decimal:2',
            'current_stock'       => 'integer',
            'min_stock_threshold' => 'integer',
            'expiry_date'         => 'date',
            'active'              => 'boolean',
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

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock_threshold;
    }

    public function isExpiringSoon(int $days = 3): bool
    {
        return $this->expiry_date !== null && $this->expiry_date->lte(now()->addDays($days));
    }
}
