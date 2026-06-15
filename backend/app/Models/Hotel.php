<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class Hotel extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'nit',
        'address',
        'phone',
        'email',
        'city',
        'country',
        'logo_path',
        'check_in_time',
        'check_out_time',
        'late_checkout_fee',
        'currency',
        'tax_rate',
    ];

    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($this->logo_path);
    }

    protected function casts(): array
    {
        return [
            'late_checkout_fee' => 'decimal:2',
            'tax_rate'          => 'decimal:4',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'hotel_user');
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(HotelInventory::class);
    }
}
