<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasUuids, BelongsToHotel;

    protected $fillable = [
        'hotel_id',
        'asset_code', 'name', 'brand', 'model', 'serial_number',
        'location_type', 'room_id', 'purchase_date', 'warranty_expiry', 'status',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date'   => 'date',
            'warranty_expiry' => 'date',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(AssetMaintenance::class);
    }

    public function repairOrders(): HasMany
    {
        return $this->hasMany(RepairOrder::class);
    }
}
