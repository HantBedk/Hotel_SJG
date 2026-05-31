<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

trait PessimisticLock
{
    /**
     * Ejecuta una operación crítica con SELECT FOR UPDATE.
     * Garantiza que dos recepcionistas no puedan operar sobre la misma habitación simultáneamente.
     *
     * Uso:
     *   $this->withLock(fn() => Room::lockForUpdate()->find($id), function ($room) {
     *       // operación crítica
     *   });
     */
    protected function withLock(callable $lockQuery, callable $operation): mixed
    {
        return DB::transaction(function () use ($lockQuery, $operation) {
            $locked = $lockQuery();
            return $operation($locked);
        });
    }

    /**
     * Bloquea un modelo específico para escritura exclusiva dentro de una transacción.
     * Si el modelo ya está en un estado inválido al bloquearse, lanza una excepción.
     */
    protected function lockModel(Model $model, string $expectedStatus, string $statusField = 'status'): Model
    {
        $fresh = $model->newQuery()
            ->lockForUpdate()
            ->findOrFail($model->getKey());

        if ($fresh->{$statusField} !== $expectedStatus) {
            throw new \RuntimeException(
                "Conflicto de concurrencia: la habitación ya no está en estado '{$expectedStatus}'. " .
                "Estado actual: '{$fresh->{$statusField}}'. Recarga e intenta de nuevo."
            );
        }

        return $fresh;
    }
}
