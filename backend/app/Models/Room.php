<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasUuids, BelongsToHotel;

    public const STATUS_AVAILABLE   = 'available';
    public const STATUS_OCCUPIED    = 'occupied';
    public const STATUS_RESERVED    = 'reserved';
    public const STATUS_CLEANING    = 'cleaning';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_BLOCKED     = 'blocked';

    public const STATUSES = [
        self::STATUS_AVAILABLE,
        self::STATUS_OCCUPIED,
        self::STATUS_RESERVED,
        self::STATUS_CLEANING,
        self::STATUS_MAINTENANCE,
        self::STATUS_BLOCKED,
    ];

    protected $fillable = [
        'hotel_id',
        'room_type_id',
        'house_id',
        'number',
        'floor',
        'status',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'floor'     => 'integer',
        ];
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function repairOrders(): HasMany
    {
        return $this->hasMany(RepairOrder::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_AVAILABLE);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderByRaw('floor NULLS LAST, number');
    }
}
