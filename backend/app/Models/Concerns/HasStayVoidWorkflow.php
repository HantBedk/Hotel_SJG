<?php

namespace App\Models\Concerns;

use App\Models\StayVoidRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Flujo de anulación por check-in erróneo (solicitud → revisión admin).
 *
 * @mixin Model
 * @phpstan-require-extends Model
 * @property string $status
 * @method HasMany hasMany(string $related, ?string $foreignKey = null, ?string $localKey = null)
 * @method HasOne hasOne(string $related, ?string $foreignKey = null, ?string $localKey = null)
 */
trait HasStayVoidWorkflow
{
    public const STATUS_VOID_PENDING  = 'void_pending';
    public const STATUS_VOIDED        = 'voided';
    public const STATUS_VOID_REJECTED = 'void_rejected';

    /** Estados de anulación (excluidos de operación e ingresos activos). */
    public const VOID_STATUSES = [
        self::STATUS_VOID_PENDING,
        self::STATUS_VOIDED,
        self::STATUS_VOID_REJECTED,
    ];

    /** Anulación resuelta (aprobada o rechazada; solo auditoría). */
    public const VOID_RESOLVED_STATUSES = [
        self::STATUS_VOIDED,
        self::STATUS_VOID_REJECTED,
    ];

    public function voidRequests(): HasMany
    {
        return $this->hasMany(StayVoidRequest::class);
    }

    public function pendingVoidRequest(): HasOne
    {
        return $this->hasOne(StayVoidRequest::class)
            ->where('status', StayVoidRequest::STATUS_PENDING);
    }

    public function isVoidPending(): bool
    {
        return $this->status === self::STATUS_VOID_PENDING;
    }

    public function isVoidApproved(): bool
    {
        return $this->status === self::STATUS_VOIDED;
    }

    public function isVoidRejected(): bool
    {
        return $this->status === self::STATUS_VOID_REJECTED;
    }

    public function isVoidResolved(): bool
    {
        return in_array($this->status, self::VOID_RESOLVED_STATUSES, true);
    }
}
