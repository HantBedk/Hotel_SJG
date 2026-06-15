<?php

namespace App\Models\Concerns;

use App\Models\Persona;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Mapea la FK `person_id` y la relación `guest()` para compatibilidad API legacy (`guest_id`).
 *
 * @mixin Model
 * @phpstan-require-extends Model
 * @property string|null $person_id
 * @property array<string, mixed> $attributes
 * @method BelongsTo belongsTo(string $related, ?string $foreignKey = null, ?string $ownerKey = null, ?string $relation = null)
 */
trait HasPersonGuestRelation
{
    public function guest(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'person_id');
    }

    public function person(): BelongsTo
    {
        return $this->guest();
    }

    public function getGuestIdAttribute(): ?string
    {
        return $this->person_id;
    }

    public function setGuestIdAttribute(?string $value): void
    {
        $this->attributes['person_id'] = $value;
    }
}
