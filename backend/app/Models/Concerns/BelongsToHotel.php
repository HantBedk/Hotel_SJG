<?php

namespace App\Models\Concerns;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Scope multitenant por hotel_id. Solo usar en modelos Eloquent.
 *
 * @mixin Model
 * @phpstan-require-extends Model
 */
trait BelongsToHotel
{
    public static function bootBelongsToHotel(): void
    {
        self::registerBelongsToHotelScopes(static::class);
    }

    /**
     * @param class-string<Model> $modelClass
     */
    private static function registerBelongsToHotelScopes(string $modelClass): void
    {
        $modelClass::addGlobalScope('hotel', function (Builder $builder) {
            if ($hotelId = TenantContext::id()) {
                $builder->where($builder->getModel()->getTable() . '.hotel_id', $hotelId);
            }
        });

        $modelClass::creating(function (Model $model) {
            if (! $model->hotel_id && TenantContext::id()) {
                $model->hotel_id = TenantContext::id();
            }
        });
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hotel::class);
    }
}
