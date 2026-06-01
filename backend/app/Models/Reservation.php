<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'guest_id',
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

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
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

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed']);
    }

    public function scopeUpcoming($query, int $hours = 24)
    {
        return $query->whereIn('status', ['pending', 'confirmed'])
            ->whereBetween('start_date', [now()->toDateString(), now()->addHours($hours)->toDateString()]);
    }
}
