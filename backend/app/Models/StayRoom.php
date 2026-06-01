<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StayRoom extends Model
{
    use HasUuids;

    protected $fillable = [
        'stay_id',
        'room_id',
        'check_in_date',
        'check_out_date',
        'price_per_night',
        'nights',
        'subtotal',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'check_in_date'   => 'date',
            'check_out_date'  => 'date',
            'price_per_night' => 'decimal:2',
            'nights'          => 'integer',
            'subtotal'        => 'decimal:2',
            'is_active'       => 'boolean',
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
}
