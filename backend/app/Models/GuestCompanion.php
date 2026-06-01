<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestCompanion extends Model
{
    use HasUuids;

    protected $fillable = [
        'guest_id',
        'name',
        'document_type',
        'document_number',
        'relationship',
        'age',
    ];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
        ];
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }
}
