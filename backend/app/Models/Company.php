<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Empresas vinculadas al hotel vía estadías o reservas (no tienen hotel_id propio).
     */
    public function scopeForHotel(Builder $query, string $hotelId): Builder
    {
        return $query->where(function (Builder $q) use ($hotelId) {
            $q->whereHas('stays', fn (Builder $stay) => $stay->where('hotel_id', $hotelId))
              ->orWhereHas('reservations', fn (Builder $reservation) => $reservation->where('hotel_id', $hotelId));
        });
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $pattern = '%' . $term . '%';

        return $query->where(function (Builder $q) use ($pattern) {
            $q->whereRaw('name ILIKE ?', [$pattern])
              ->orWhereRaw('nit ILIKE ?', [$pattern])
              ->orWhereRaw('contact_name ILIKE ?', [$pattern]);
        });
    }
}
