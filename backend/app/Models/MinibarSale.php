<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MinibarSale extends Model
{
    use HasUuids, BelongsToHotel;

    protected $fillable = [
        'hotel_id',
        'sale_number',
        'customer_name',
        'customer_document',
        'guest_id',
        'subtotal',
        'total',
        'payment_method',
        'status',
        'paid_at',
        'cancelled_at',
        'cancellation_reason',
        'notes',
        'registered_by',
        'cancelled_by_id',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'     => 'decimal:2',
            'total'        => 'decimal:2',
            'paid_at'      => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(MinibarSaleItem::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function scopePending(Builder $q): Builder
    {
        return $q->where('status', 'pending');
    }

    public function scopePaid(Builder $q): Builder
    {
        return $q->where('status', 'paid');
    }

    public function scopeCancelled(Builder $q): Builder
    {
        return $q->where('status', 'cancelled');
    }
}
