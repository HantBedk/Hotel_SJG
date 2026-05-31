<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'nit',
        'address',
        'phone',
        'email',
        'contact_name',
        'notes',
    ];

    public function stays(): HasMany
    {
        return $this->hasMany(Stay::class);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->whereRaw('name ILIKE ?', ["%{$term}%"])
              ->orWhere('nit', 'ILIKE', "%{$term}%")
              ->orWhere('contact_name', 'ILIKE', "%{$term}%");
        });
    }
}
