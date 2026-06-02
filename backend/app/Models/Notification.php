<?php

namespace App\Models;

use App\Events\NewNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['type', 'title', 'message', 'payload', 'is_read', 'user_id', 'read_at', 'created_at'];

    protected function casts(): array
    {
        return [
            'payload'    => 'array',
            'is_read'    => 'boolean',
            'read_at'    => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->created_at ??= now();
        });

        static::created(function (self $model) {
            broadcast(new NewNotification($model))->toOthers();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
