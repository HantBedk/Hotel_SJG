<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinibarSaleItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'minibar_sale_id',
        'minibar_product_id',
        'product_name',
        'product_code',
        'quantity',
        'unit_price',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'quantity'   => 'integer',
            'unit_price' => 'decimal:2',
            'total'      => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(MinibarSale::class, 'minibar_sale_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(MinibarProduct::class, 'minibar_product_id');
    }
}
