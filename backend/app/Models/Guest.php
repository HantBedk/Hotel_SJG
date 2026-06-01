<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guest extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'full_name',
        'document_type',
        'document_number',
        'email',
        'phone',
        'nationality',
        'birth_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function companions(): HasMany
    {
        return $this->hasMany(GuestCompanion::class);
    }

    public function stays(): HasMany
    {
        return $this->hasMany(Stay::class);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->whereRaw('full_name ILIKE ?', ["%{$term}%"])
              ->orWhere('document_number', 'ILIKE', "%{$term}%")
              ->orWhere('phone', 'ILIKE', "%{$term}%")
              ->orWhere('email', 'ILIKE', "%{$term}%");
        });
    }
}
