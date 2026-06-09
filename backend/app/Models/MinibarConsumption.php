<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinibarConsumption extends Model
{
    use HasUuids;

    protected $fillable = [
        'stay_id', 'room_id', 'product_name', 'quantity',
        'type', 'unit_price', 'total', 'registered_at', 'registered_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity'      => 'integer',
            'unit_price'    => 'decimal:2',
            'total'         => 'decimal:2',
            'registered_at' => 'datetime',
        ];
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(Stay::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }
}
