<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExtraService extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'price', 'description', 'active'];

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
