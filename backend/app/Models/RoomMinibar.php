<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomMinibar extends Model
{
    use HasUuids;

    protected $fillable = [
        'room_id', 'minibar_product_id', 'quantity', 'last_restocked_at', 'restocked_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity'          => 'integer',
            'last_restocked_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(MinibarProduct::class, 'minibar_product_id');
    }

    public function restockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restocked_by');
    }
}
