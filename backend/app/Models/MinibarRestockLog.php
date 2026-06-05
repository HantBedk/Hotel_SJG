<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinibarRestockLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'room_id', 'minibar_product_id', 'product_name',
        'quantity', 'unit_price', 'total_value',
        'performed_by', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity'    => 'integer',
            'unit_price'  => 'decimal:2',
            'total_value' => 'decimal:2',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function minibarProduct(): BelongsTo
    {
        return $this->belongsTo(MinibarProduct::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
