<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasUuids, BelongsToHotel;

    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'action',
        'user_id',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload'    => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(string $action, ?string $userId = null, array $payload = []): self
    {
        return static::create([
            'hotel_id'   => TenantContext::id(),
            'action'     => $action,
            'user_id'    => $userId,
            'payload'    => $payload,
            'created_at' => now(),
        ]);
    }
}
