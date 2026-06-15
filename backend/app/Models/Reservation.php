<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use App\Models\Concerns\HasPersonGuestRelation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    use HasUuids, SoftDeletes, BelongsToHotel, HasPersonGuestRelation;

    private const ACTIVE_STATUSES = ['pending', 'confirmed'];

    private const NON_BLOCKING_STATUSES = ['cancelled', 'no_show', 'checked_in'];

    protected $fillable = [
        'hotel_id',
        'group_id',
        'billing_mode',
        'person_id',
        'company_id',
        'room_id',
        'house_id',
        'status',
        'start_date',
        'end_date',
        'nights',
        'agreed_price',
        'deposit_amount',
        'payment_status',
        'created_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date'     => 'date',
            'end_date'       => 'date',
            'agreed_price'   => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'nights'         => 'integer',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stay(): HasOne
    {
        return $this->hasOne(Stay::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ReservationPayment::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES);
    }

    public function scopeUpcoming(Builder $query, int $hours = 24): Builder
    {
        return $query->active()
            ->whereBetween('start_date', [now()->toDateString(), now()->addHours($hours)->toDateString()]);
    }

    public function scopeInDateRange(Builder $query, ?string $from = null, ?string $to = null): Builder
    {
        if ($from !== null) {
            $query->where('end_date', '>=', $from);
        }

        if ($to !== null) {
            $query->where('start_date', '<=', $to);
        }

        return $query;
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $pattern = '%' . $term . '%';

        return $query->whereHas('guest', function (Builder $guestQuery) use ($pattern) {
            $guestQuery->search($pattern);
        });
    }

    public function scopeOverlappingRoom(
        Builder $query,
        string $roomId,
        string $startDate,
        string $endDate,
        ?string $excludeId = null,
    ): Builder {
        $query->where('room_id', $roomId)
            ->whereNotIn('status', self::NON_BLOCKING_STATUSES)
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query;
    }

    public function scopeOverlappingHouse(
        Builder $query,
        string $houseId,
        string $startDate,
        string $endDate,
        ?string $excludeId = null,
    ): Builder {
        $query->where('house_id', $houseId)
            ->whereNotIn('status', self::NON_BLOCKING_STATUSES)
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query;
    }
}
