<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'is_minor',
        'relationship',
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
            'is_minor'   => 'boolean',
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

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Huéspedes vinculados al hotel vía estadías o reservas (no tienen hotel_id propio).
     */
    public function scopeForHotel(Builder $query, string $hotelId): Builder
    {
        return $query->where(function (Builder $q) use ($hotelId) {
            $q->whereHas('stays', fn (Builder $stay) => $stay->where('hotel_id', $hotelId))
              ->orWhereHas('reservations', fn (Builder $reservation) => $reservation->where('hotel_id', $hotelId));
        });
    }

    public function scopeWithStaysCountForHotel(Builder $query, ?string $hotelId = null): Builder
    {
        return $query->withCount([
            'stays as stays_count' => function (Builder $stayQuery) use ($hotelId) {
                if ($hotelId !== null) {
                    $stayQuery->where('hotel_id', $hotelId);
                }
            },
        ]);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $pattern = '%' . $term . '%';

        return $query->where(function (Builder $q) use ($pattern) {
            $q->whereRaw('full_name ILIKE ?', [$pattern])
              ->orWhereRaw('document_number ILIKE ?', [$pattern])
              ->orWhereRaw('phone ILIKE ?', [$pattern])
              ->orWhereRaw('email ILIKE ?', [$pattern]);
        });
    }
}
