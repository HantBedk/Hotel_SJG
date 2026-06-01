<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

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

    protected function casts(): array
    {
        return [
            'late_checkout_fee' => 'decimal:2',
            'tax_rate'          => 'decimal:4',
        ];
    }
}
