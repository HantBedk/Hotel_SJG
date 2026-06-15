<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExtraService extends Model
{
    use HasUuids, BelongsToHotel;

    protected $fillable = ['hotel_id', 'name', 'price', 'description', 'active'];

    protected function casts(): array
    {
        return [
            'price'  => 'decimal:2',
            'active' => 'boolean',
        ];
    }

    public function stayServices(): HasMany
    {
        return $this->hasMany(StayService::class);
    }
}
