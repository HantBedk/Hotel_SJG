<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StayService extends Model
{
    use HasUuids;

    protected $fillable = [
        'stay_id',
        'extra_service_id',
        'quantity',
        'unit_price',
        'total',
        'applied_at',
        'applied_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity'   => 'integer',
            'unit_price' => 'decimal:2',
            'total'      => 'decimal:2',
            'applied_at' => 'datetime',
        ];
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(Stay::class);
    }

    public function extraService(): BelongsTo
    {
        return $this->belongsTo(ExtraService::class);
    }

    public function appliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by');
    }
}
