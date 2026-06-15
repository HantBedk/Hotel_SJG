<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomType extends Model
{
    use HasUuids, BelongsToHotel;

    protected $fillable = [
        'hotel_id',
        'name',
        'description',
        'base_price',
        'max_occupancy',
        'amenities',
    ];

    protected function casts(): array
    {
        return [
            'base_price'    => 'decimal:2',
            'amenities'     => 'array',
            'max_occupancy' => 'integer',
        ];
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
