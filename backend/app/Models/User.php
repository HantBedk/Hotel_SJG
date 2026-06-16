<?php

namespace App\Models;

use App\Models\Concerns\DelegatesRolesToPersona;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Arr;
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

    /**
     * Spatie PermissionMiddleware usa canAny(); Authorizable lo resuelve vía Gate
     * (no conoce la delegación a Persona). Redirigimos a can() sobreescrito.
     *
     * @param iterable|\UnitEnum|string $abilities
     * @param mixed $arguments
     */
    public function canAny($abilities, $arguments = []): bool
    {
        foreach (Arr::wrap($abilities) as $ability) {
            if ($ability instanceof \BackedEnum) {
                $ability = $ability->value;
            }

            if ($this->can($ability, $arguments)) {
                return true;
            }
        }

        return false;
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
