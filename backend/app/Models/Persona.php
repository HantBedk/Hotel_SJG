<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Support\PersonNameParser;
use Spatie\Permission\Traits\HasRoles;

class Persona extends Model
{
    use HasUuids, SoftDeletes, HasRoles;

    protected $table = 'personas';

    protected $fillable = [
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'document_type',
        'document_number',
        'is_minor',
        'relationship',
        'email',
        'phone',
        'nationality_id',
        'birth_date',
        'notes',
    ];

    protected $appends = ['full_name'];

    public const LIST_COLUMNS = [
        'id',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'document_type',
        'document_number',
        'phone',
        'nationality_id',
    ];

    public static function listSelect(): string
    {
        return implode(',', self::LIST_COLUMNS);
    }

    protected function getDefaultGuardName(): string
    {
        return 'sanctum';
    }

    /** Spatie Permission: Persona no es Authenticatable; declara el guard explícitamente. */
    public function guardName(): string
    {
        return 'sanctum';
    }

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_minor'   => 'boolean',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return PersonNameParser::join(
            $this->primer_nombre,
            $this->segundo_nombre,
            $this->primer_apellido,
            $this->segundo_apellido,
        );
    }

    public function nationality(): BelongsTo
    {
        return $this->belongsTo(Nationality::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'person_id');
    }

    public function stays(): HasMany
    {
        return $this->hasMany(Stay::class, 'person_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'person_id');
    }

    public function scopeGuests(Builder $query): Builder
    {
        return $query->role('guest');
    }

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
            $q->whereRaw('primer_nombre ILIKE ?', [$pattern])
              ->orWhereRaw('segundo_nombre ILIKE ?', [$pattern])
              ->orWhereRaw('primer_apellido ILIKE ?', [$pattern])
              ->orWhereRaw('segundo_apellido ILIKE ?', [$pattern])
              ->orWhereRaw('document_number ILIKE ?', [$pattern])
              ->orWhereRaw('phone ILIKE ?', [$pattern])
              ->orWhereRaw('email ILIKE ?', [$pattern]);
        });
    }

    public function fillFromLegacyFullName(?string $fullName): self
    {
        $parts = PersonNameParser::split($fullName ?? '');
        $this->fill($parts);

        return $this;
    }
}
