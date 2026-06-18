<?php

namespace App\Support;

final class EmailNormalizer
{
    public static function normalize(?string $email): ?string
    {
        if ($email === null) {
            return null;
        }

        $normalized = strtolower(trim($email));

        return $normalized === '' ? null : $normalized;
    }
}
