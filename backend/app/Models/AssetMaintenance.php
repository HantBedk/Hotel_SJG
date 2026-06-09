<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetMaintenance extends Model
{
    use HasUuids;

    protected $fillable = [
        'asset_id', 'scheduled_date', 'completed_date', 'description',
        'cost', 'technician_id', 'next_maintenance_date', 'status',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date'      => 'date',
            'completed_date'      => 'date',
            'next_maintenance_date' => 'date',
            'cost'                => 'decimal:2',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
