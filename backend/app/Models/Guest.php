<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

/** @deprecated Use Persona directly */
class Guest extends Persona
{
    /**
     * Los roles Spatie viven con morph App\Models\Persona (tabla unificada).
     */
    public function getMorphClass(): string
    {
        return Persona::class;
    }

    protected static function booted(): void
    {
        static::addGlobalScope('guest_role', function (Builder $builder) {
            $builder->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('name', 'guest'));
        });
    }
}
