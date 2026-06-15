<?php

namespace App\Models\Concerns;

use App\Models\StayPerson;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Extiende {@see HasPersonGuestRelation} con pivote de huéspedes en estadía.
 */
trait HasGuestPersonAlias
{
    use HasPersonGuestRelation;

    public function stayGuests(): HasMany
    {
        return $this->stayPersons();
    }

    public function stayPersons(): HasMany
    {
        return $this->hasMany(StayPerson::class);
    }
}
