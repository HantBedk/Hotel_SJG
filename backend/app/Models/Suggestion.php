<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Suggestion extends Model
{
    use HasUuids;

    protected $fillable = [
        'type',
        'title',
        'description',
        'confidence_score',
        'data',
        'dismissed',
        'dismissed_by',
    ];

    protected function casts(): array
    {
        return [
            'data'             => 'array',
            'dismissed'        => 'boolean',
            'confidence_score' => 'decimal:2',
        ];
    }

    public function dismissedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dismissed_by');
    }
}
