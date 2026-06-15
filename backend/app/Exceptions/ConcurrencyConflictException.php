<?php

namespace App\Exceptions;

use RuntimeException;

class ConcurrencyConflictException extends RuntimeException
{
    public static function unexpectedStatus(string $expectedStatus, string $actualStatus): self
    {
        return new self(
            "Conflicto de concurrencia: la habitación ya no está en estado '{$expectedStatus}'. " .
            "Estado actual: '{$actualStatus}'. Recarga e intenta de nuevo."
        );
    }
}
