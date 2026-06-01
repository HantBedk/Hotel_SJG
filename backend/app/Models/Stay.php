<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stay extends Model
{
    use HasUuids;

    protected $fillable = [
        'guest_id',
        'company_id',
        'reservation_id',
        'status',
        'check_in_datetime',
        'check_out_datetime',
        'actual_check_out_datetime',
        'late_checkout_fee',
        'total_amount',
        'paid_amount',
        'created_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'check_in_datetime'          => 'datetime',
            'check_out_datetime'         => 'datetime',
            'actual_check_out_datetime'  => 'datetime',
            'late_checkout_fee'          => 'decimal:2',
            'total_amount'               => 'decimal:2',
            'paid_amount'                => 'decimal:2',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stayRooms(): HasMany
    {
        return $this->hasMany(StayRoom::class);
    }

    public function stayGuests(): HasMany
    {
        return $this->hasMany(StayGuest::class);
    }

    public function activeStayRooms(): HasMany
    {
        return $this->hasMany(StayRoom::class)->where('is_active', true);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(RoomTransfer::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(StayService::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function pendingBalance(): float
    {
        return (float) $this->total_amount - (float) $this->paid_amount;
    }
}
