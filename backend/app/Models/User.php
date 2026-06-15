<?php

namespace App\Models;

use App\Models\Concerns\DelegatesRolesToPersona;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasUuids, HasApiTokens, DelegatesRolesToPersona;

    protected $fillable = [
        'person_id',
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_active'         => 'boolean',
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'person_id');
    }

    /**
     * @param string|array<int, string> $ability
     * @param mixed $arguments
     */
    public function can($ability, $arguments = []): bool
    {
        return $this->canViaPersona($ability, $arguments);
    }

    public function hotels(): BelongsToMany
    {
        return $this->belongsToMany(Hotel::class, 'hotel_user');
    }

    public function getNameAttribute(): ?string
    {
        return $this->persona?->full_name;
    }

    public function getDocumentNumberAttribute(): ?string
    {
        return $this->persona?->document_number;
    }

    public function getPhoneAttribute(): ?string
    {
        return $this->persona?->phone;
    }
}
