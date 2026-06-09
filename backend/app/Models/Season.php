<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Season extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'start_date', 'end_date', 'multiplier', 'active'];

    protected function casts(): array
    {
        return [
            'start_date'  => 'date',
            'end_date'    => 'date',
            'multiplier'  => 'decimal:2',
            'active'      => 'boolean',
        ];
    }
}
