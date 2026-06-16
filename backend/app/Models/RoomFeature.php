<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoomFeature extends Model
{
    use HasUuids, BelongsToHotel;

    protected $fillable = [
        'hotel_id',
        'name',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function rooms(): BelongsToMany
    {
        return $this->belongsToMany(Room::class, 'room_room_feature');
    }
}
