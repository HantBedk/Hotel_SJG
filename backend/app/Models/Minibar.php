<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Minibar extends Model
{
    use HasUuids;

    protected $fillable = ['room_id', 'name', 'notes', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function items(): HasMany
    {
        // Los items del minibar son los RoomMinibar registrados para esta habitación.
        return $this->hasMany(RoomMinibar::class, 'room_id', 'room_id');
    }
}
