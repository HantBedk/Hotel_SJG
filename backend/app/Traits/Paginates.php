<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait Paginates
{
    protected function perPage(Request $request, int $default = 20, int $max = 100): int
    {
        $value = (int) $request->query('per_page', $default);
        if ($value < 1) {
            return $default;
        }
        return min($value, $max);
    }
}
