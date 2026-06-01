<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasUuids;

    protected $fillable = [
        'stay_id',
        'amount',
        'payment_method',
        'payment_type',
        'paid_by',
        'payment_split_details',
        'receipt_path',
        'receptionist_id',
        'payment_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount'                 => 'decimal:2',
            'payment_split_details'  => 'array',
            'payment_date'           => 'datetime',
        ];
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(Stay::class);
    }

    public function receptionist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receptionist_id');
    }
}
