<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationPayment extends Model
{
    use HasUuids;

    protected $fillable = [
        'reservation_id',
        'amount',
        'payment_method',
        'payment_type',
        'receptionist_id',
        'payment_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount'       => 'decimal:2',
            'payment_date' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function receptionist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receptionist_id');
    }
}
